import { AppError } from '../utils/app-error'
import { ERROR_CODES } from '../constants/errors'
import { parsePagination, buildPaginated, type Paginated } from '../utils/pagination'
import type { ProductStatus } from '@prisma/client'
import type {
  ProductRepository,
  ProductWithRelations,
} from '../repositories/product.repository'
import type { CategoryRepository } from '../repositories/category.repository'
import type { SupplierRepository } from '../repositories/supplier.repository'
import type { SupplierProductRepository } from '../repositories/supplier-product.repository'
import type { StockService } from './stock.service'
import type { CreateProductInput, ProductListQuery, UpdateProductInput } from '../schemas/product'

export interface ProductServiceDeps {
  productRepository: ProductRepository
  categoryRepository: CategoryRepository
  supplierRepository: SupplierRepository
  supplierProductRepository: SupplierProductRepository
  stockService: StockService
}

export class ProductService {
  constructor(private readonly deps: ProductServiceDeps) {}

  private async assertCategory(categoryId: number): Promise<void> {
    const category = await this.deps.categoryRepository.findById(categoryId)
    if (!category) {
      throw new AppError(400, ERROR_CODES.INVALID_RELATION, 'La categoría no existe')
    }
  }

  private async assertSupplier(supplierId: number | null | undefined): Promise<void> {
    if (supplierId == null) return
    const supplier = await this.deps.supplierRepository.findById(supplierId)
    if (!supplier) {
      throw new AppError(400, ERROR_CODES.INVALID_RELATION, 'El proveedor no existe')
    }
    if (supplier.status === 'INACTIVE') {
      throw new AppError(400, ERROR_CODES.INVALID_RELATION, 'El proveedor está inactivo')
    }
  }

  // Mantiene el listado de pedidos del proveedor al día: cuando un producto de la
  // tienda tiene un proveedor asignado, se asegura de que exista una entrada en su
  // listado (SupplierProduct) para poder ordenarlo por WhatsApp.
  private async ensureSupplierProduct(supplierId: number, name: string, categoryId: number): Promise<void> {
    const normalized = normalizeName(name)
    const existing = await this.deps.supplierProductRepository.findBySupplierAndName(supplierId, normalized)
    if (existing) return
    await this.deps.supplierProductRepository.create(supplierId, {
      name: normalized,
      notes: null,
      categoryId,
      status: 'ACTIVE',
    })
  }

  async list(query: ProductListQuery): Promise<Paginated<ProductWithRelations>> {
    const pagination = parsePagination(String(query.page ?? ''), String(query.limit ?? ''))

    // Filtro especial de stock bajo: consulta de columnas comparadas (stock < stockMin).
    if (query.lowStock) {
      const ids = await this.deps.productRepository.listLowStockIds()
      const slice = ids.slice(pagination.skip, pagination.skip + pagination.limit)
      const products = await this.deps.productRepository.findByIdsWithRelations(slice)
      return buildPaginated(products, ids.length, pagination)
    }

    const filters = {
      search: query.search,
      categoryId: query.categoryId,
      supplierId: query.supplierId,
      status: query.status,
    }
    const [items, total] = await Promise.all([
      this.deps.productRepository.list({ ...filters, skip: pagination.skip, limit: pagination.limit }),
      this.deps.productRepository.count(filters),
    ])
    return buildPaginated(items, total, pagination)
  }

  async get(id: number): Promise<ProductWithRelations> {
    const product = await this.deps.productRepository.findByIdWithRelations(id)
    if (!product) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Producto no encontrado')
    }
    return product
  }

  async create(input: CreateProductInput): Promise<ProductWithRelations> {
    await this.assertCategory(input.categoryId)
    await this.assertSupplier(input.supplierId)

    const initialStock = input.stock ?? 0
    // El stock siempre se maneja mediante movimientos: se crea el producto en 0
    // y, si hay stock inicial, se registra una entrada tipo BUY.
    const product = await this.deps.productRepository.create({
      name: input.name,
      categoryId: input.categoryId,
      supplierId: input.supplierId ?? null,
      stock: 0,
      stockMin: input.stockMin ?? 0,
      imageUrl: input.imageUrl || null,
      status: 'ACTIVE',
    })

    if (initialStock > 0) {
      await this.deps.stockService.stockIn(product.id, {
        type: 'BUY',
        quantity: initialStock,
        note: 'Stock inicial',
      })
    }

    if (input.supplierId != null) {
      await this.ensureSupplierProduct(input.supplierId, product.name, product.categoryId)
    }

    const created = await this.get(product.id)
    return created
  }

  async update(id: number, input: UpdateProductInput): Promise<ProductWithRelations> {
    const existing = await this.deps.productRepository.findById(id)
    if (!existing) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Producto no encontrado')
    }

    if (input.categoryId !== undefined) await this.assertCategory(input.categoryId)
    if (input.supplierId !== undefined) await this.assertSupplier(input.supplierId)

    const updated = await this.deps.productRepository.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.supplierId !== undefined ? { supplierId: input.supplierId } : {}),
      ...(input.stockMin !== undefined ? { stockMin: input.stockMin } : {}),
      ...(input.status !== undefined ? { status: input.status as ProductStatus } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl || null } : {}),
    })
    if (!updated) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Producto no encontrado')
    }

    if (input.supplierId != null) {
      await this.ensureSupplierProduct(
        input.supplierId,
        input.name ?? existing.name,
        input.categoryId ?? existing.categoryId,
      )
    }

    return this.get(id)
  }

  // Desactiva (papelera). No borra físicamente: preserva historial.
  async deactivate(id: number): Promise<ProductWithRelations> {
    await this.assertExists(id)
    await this.deps.productRepository.update(id, { status: 'INACTIVE' })
    return this.get(id)
  }

  async restore(id: number): Promise<ProductWithRelations> {
    const product = await this.deps.productRepository.findById(id)
    if (!product) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Producto no encontrado')
    }
    // La restauración valida que las relaciones necesarias sigan siendo válidas.
    await this.assertCategory(product.categoryId)
    if (product.supplierId) await this.assertSupplier(product.supplierId)

    await this.deps.productRepository.update(id, { status: 'ACTIVE' })
    return this.get(id)
  }

  async trash(): Promise<Paginated<ProductWithRelations>> {
    return this.list({ status: 'INACTIVE', lowStock: false })
  }

  private async assertExists(id: number): Promise<void> {
    const product = await this.deps.productRepository.findById(id)
    if (!product) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Producto no encontrado')
    }
  }
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}