import { AppError } from '../utils/app-error'
import { ERROR_CODES } from '../constants/errors'
import { parsePagination, buildPaginated, type Paginated } from '../utils/pagination'
import type { SupplierProductStatus } from '@prisma/client'
import type { SupplierRepository } from '../repositories/supplier.repository'
import type { CategoryRepository } from '../repositories/category.repository'
import type {
  SupplierProductRepository,
  SupplierProductWithRelations,
} from '../repositories/supplier-product.repository'
import type {
  CreateSupplierProductInput,
  SupplierProductListQuery,
  UpdateSupplierProductInput,
} from '../schemas/supplier-product'

export interface SupplierProductServiceDeps {
  supplierProductRepository: SupplierProductRepository
  supplierRepository: SupplierRepository
  categoryRepository: CategoryRepository
}

export class SupplierProductService {
  constructor(private readonly deps: SupplierProductServiceDeps) {}

  private async assertSupplier(supplierId: number): Promise<void> {
    const supplier = await this.deps.supplierRepository.findById(supplierId)
    if (!supplier) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Proveedor no encontrado')
    }
  }

  private async assertCategory(categoryId?: number | null): Promise<void> {
    if (categoryId == null) return
    const category = await this.deps.categoryRepository.findById(categoryId)
    if (!category) {
      throw new AppError(400, ERROR_CODES.INVALID_RELATION, 'La categoría no existe')
    }
  }

  async list(supplierId: number, query: SupplierProductListQuery): Promise<Paginated<SupplierProductWithRelations>> {
    await this.assertSupplier(supplierId)
    const pagination = parsePagination(String(query.page ?? ''), String(query.limit ?? ''))
    const filters = { search: query.search, categoryId: query.categoryId, status: query.status }
    const [items, total] = await Promise.all([
      this.deps.supplierProductRepository.list(supplierId, {
        ...filters,
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      this.deps.supplierProductRepository.count(supplierId, filters),
    ])
    return buildPaginated(items, total, pagination)
  }

  async get(supplierId: number, itemId: number): Promise<SupplierProductWithRelations> {
    await this.assertSupplier(supplierId)
    const item = await this.deps.supplierProductRepository.findById(itemId)
    if (!item || item.supplierId !== supplierId) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Producto del proveedor no encontrado')
    }
    return item as SupplierProductWithRelations
  }

  async create(supplierId: number, input: CreateSupplierProductInput) {
    await this.assertSupplier(supplierId)
    await this.assertCategory(input.categoryId)

    const name = normalizeName(input.name)
    const duplicate = await this.deps.supplierProductRepository.findBySupplierAndName(supplierId, name)
    if (duplicate) {
      throw new AppError(409, ERROR_CODES.DUPLICATE_ENTRY, 'El proveedor ya tiene un producto con ese nombre')
    }

    const created = await this.deps.supplierProductRepository.create(supplierId, {
      name,
      notes: input.notes ?? null,
      categoryId: input.categoryId ?? null,
      status: 'ACTIVE',
    })
    const full = await this.deps.supplierProductRepository.findById(created.id)
    return full as SupplierProductWithRelations
  }

  async update(supplierId: number, itemId: number, input: UpdateSupplierProductInput) {
    await this.assertSupplier(supplierId)
    const existing = await this.deps.supplierProductRepository.findById(itemId)
    if (!existing || existing.supplierId !== supplierId) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Producto del proveedor no encontrado')
    }
    await this.assertCategory(input.categoryId)

    if (input.name !== undefined) {
      const name = normalizeName(input.name)
      const duplicate = await this.deps.supplierProductRepository.findBySupplierAndName(supplierId, name)
      if (duplicate && duplicate.id !== itemId) {
        throw new AppError(409, ERROR_CODES.DUPLICATE_ENTRY, 'El proveedor ya tiene un producto con ese nombre')
      }
    }

    const updated = await this.deps.supplierProductRepository.update(itemId, {
      ...(input.name !== undefined ? { name: normalizeName(input.name) } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.status !== undefined ? { status: input.status as SupplierProductStatus } : {}),
    })
    if (!updated) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Producto del proveedor no encontrado')
    }
    return updated as SupplierProductWithRelations
  }

  // Desactiva el item del listado. NO afecta a ningún Product de la tienda.
  async deactivate(supplierId: number, itemId: number) {
    await this.assertSupplier(supplierId)
    const existing = await this.deps.supplierProductRepository.findById(itemId)
    if (!existing || existing.supplierId !== supplierId) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Producto del proveedor no encontrado')
    }
    const updated = await this.deps.supplierProductRepository.update(itemId, { status: 'INACTIVE' })
    if (!updated) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Producto del proveedor no encontrado')
    }
    return updated as SupplierProductWithRelations
  }
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}