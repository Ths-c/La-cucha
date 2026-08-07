import { Prisma, type PrismaClient, type Product, type ProductStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'

// Base de datos (PrismaClient o cliente de transacción dentro de $transaction).
export type Tx = PrismaClient | Prisma.TransactionClient

// Filtros para listar productos.
export interface ProductListFilters {
  search?: string
  categoryId?: number
  supplierId?: number
  status?: ProductStatus
  skip: number
  limit: number
  orderBy?: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[]
}

// DTO de producto con relaciones resueltas.
export type ProductWithRelations = Product & {
  category: { id: number; name: string }
  supplier: { id: number; name: string } | null
}

export interface ProductRepository {
  findById(id: number): Promise<Product | null>
  findByIdWithRelations(id: number): Promise<ProductWithRelations | null>
  list(filters: ProductListFilters): Promise<ProductWithRelations[]>
  count(filters: Omit<ProductListFilters, 'skip' | 'limit' | 'take'>): Promise<number>
  create(data: Prisma.ProductUncheckedCreateInput): Promise<Product>
  update(id: number, data: Prisma.ProductUncheckedUpdateInput): Promise<Product | null>
  findByIdsWithRelations(ids: number[]): Promise<ProductWithRelations[]>
  listLowStockIds(limit?: number): Promise<number[]>
  countLowStock(): Promise<number>
  countByStatus(status: ProductStatus): Promise<number>
  readForUpdate(tx: Tx, id: number): Promise<{ id: number; name: string; stock: number; stockMin: number; status: ProductStatus } | null>
  readStock(tx: Tx, id: number): Promise<number | null>
  incrementStock(tx: Tx, id: number, quantity: number): Promise<boolean>
  decrementStock(tx: Tx, id: number, quantity: number): Promise<boolean>
}

class PrismaProductRepository implements ProductRepository {
  private buildWhere(filters: Omit<ProductListFilters, 'skip' | 'limit' | 'orderBy'>): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {}
    if (filters.search) {
      where.name = { contains: filters.search, mode: 'insensitive' }
    }
    if (filters.categoryId !== undefined) where.categoryId = filters.categoryId
    if (filters.supplierId !== undefined) where.supplierId = filters.supplierId
    if (filters.status !== undefined) where.status = filters.status
    return where
  }

  async findById(id: number): Promise<Product | null> {
    return prisma.product.findUnique({ where: { id } })
  }

  async findByIdWithRelations(id: number): Promise<ProductWithRelations | null> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    })
    return product as ProductWithRelations | null
  }

  async list(filters: ProductListFilters): Promise<ProductWithRelations[]> {
    const products = await prisma.product.findMany({
      where: this.buildWhere(filters),
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
      orderBy: filters.orderBy ?? [{ createdAt: 'desc' }],
      skip: filters.skip,
      take: filters.limit,
    })
    return products as ProductWithRelations[]
  }

  async count(filters: Omit<ProductListFilters, 'skip' | 'limit'>): Promise<number> {
    return prisma.product.count({ where: this.buildWhere(filters) })
  }

  async create(data: Prisma.ProductUncheckedCreateInput): Promise<Product> {
    return prisma.product.create({ data })
  }

  async update(id: number, data: Prisma.ProductUncheckedUpdateInput): Promise<Product | null> {
    return prisma.product.update({ where: { id }, data })
  }

  async readStock(tx: Tx, id: number): Promise<number | null> {
    const product = await tx.product.findUnique({ where: { id }, select: { stock: true } })
    return product?.stock ?? null
  }

  /**
   * Lee el producto BLOQUEANDO la fila (`SELECT ... FOR UPDATE`) dentro de una
   * transacción. Serializa operaciones de stock concurrentes sobre el mismo
   * producto para que `stockBefore`/`stockAfter` del movimiento sean exactos
   * (evita condiciones de carrera en el historial, no solo en el saldo).
   */
  async readForUpdate(
    tx: Tx,
    id: number,
  ): Promise<{ id: number; name: string; stock: number; stockMin: number; status: ProductStatus } | null> {
    const rows = await tx.$queryRaw<
      { id: number; name: string; stock: number; stockMin: number; status: string }[]
    >`SELECT id, name, stock, "stockMin", status::text FROM products WHERE id = ${id} FOR UPDATE`
    const row = rows[0]
    if (!row) return null
    return {
      id: row.id,
      name: row.name,
      stock: row.stock,
      stockMin: row.stockMin,
      status: row.status as ProductStatus,
    }
  }

  async findByIdsWithRelations(ids: number[]): Promise<ProductWithRelations[]> {
    if (ids.length === 0) return []
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    })
    return products as ProductWithRelations[]
  }

  async listLowStockIds(limit?: number): Promise<number[]> {
    const rows = await prisma.$queryRaw<{ id: number }[]>`
      SELECT id
      FROM products
      WHERE status = 'ACTIVE' AND stock < "stockMin"
      ORDER BY stock ASC, id ASC
      ${limit ? Prisma.sql`LIMIT ${limit}` : Prisma.empty}`
    return rows.map((r) => Number(r.id))
  }

  async countLowStock(): Promise<number> {
    const rows = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM products
      WHERE status = 'ACTIVE' AND stock < "stockMin"`
    return Number(rows[0]?.count ?? 0)
  }

  async countByStatus(status: ProductStatus): Promise<number> {
    return prisma.product.count({ where: { status } })
  }

  async incrementStock(tx: Tx, id: number, quantity: number): Promise<boolean> {
    const res = await tx.product.updateMany({
      where: { id },
      data: { stock: { increment: quantity } },
    })
    return res.count > 0
  }

  async decrementStock(tx: Tx, id: number, quantity: number): Promise<boolean> {
    const res = await tx.product.updateMany({
      where: { id, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    })
    return res.count > 0
  }
}

export const productRepository: ProductRepository = new PrismaProductRepository()