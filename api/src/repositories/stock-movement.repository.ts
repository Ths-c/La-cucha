import type { MovementType, Prisma, StockMovement } from '@prisma/client'
import { prisma } from '../lib/prisma'
import type { Tx } from './product.repository'

export interface MovementListFilters {
  type?: MovementType
  productId?: number
  from?: Date
  to?: Date
  skip: number
  limit: number
}

export interface StockMovementRepository {
  create(tx: Tx, data: Prisma.StockMovementUncheckedCreateInput): Promise<StockMovement>
  list(filters: MovementListFilters): Promise<StockMovement[]>
  count(filters: Omit<MovementListFilters, 'skip' | 'limit'>): Promise<number>
  listByProduct(productId: number, type?: MovementType, skip?: number, limit?: number): Promise<StockMovement[]>
  countByProduct(productId: number, type?: MovementType): Promise<number>
  listByClient(clientId: number, type?: MovementType, skip?: number, limit?: number): Promise<StockMovement[]>
  countByClient(clientId: number, type?: MovementType): Promise<number>
  countInRange(from: Date, to: Date): Promise<number>
  sumQuantitiesByProduct(type: MovementType, limit: number): Promise<{ productId: number; totalQuantity: number }[]>
}

class PrismaStockMovementRepository implements StockMovementRepository {
  private buildWhere(filters: Omit<MovementListFilters, 'skip' | 'limit'>): Prisma.StockMovementWhereInput {
    const where: Prisma.StockMovementWhereInput = {}
    if (filters.type !== undefined) where.type = filters.type
    if (filters.productId !== undefined) where.productId = filters.productId
    if (filters.from !== undefined || filters.to !== undefined) {
      where.createdAt = {}
      if (filters.from) where.createdAt.gte = filters.from
      if (filters.to) where.createdAt.lt = filters.to
    }
    return where
  }

  async create(tx: Tx, data: Prisma.StockMovementUncheckedCreateInput): Promise<StockMovement> {
    return tx.stockMovement.create({ data })
  }

  async list(filters: MovementListFilters): Promise<StockMovement[]> {
    return prisma.stockMovement.findMany({
      where: this.buildWhere(filters),
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
      skip: filters.skip,
      take: filters.limit,
    })
  }

  async count(filters: Omit<MovementListFilters, 'skip' | 'limit'>): Promise<number> {
    return prisma.stockMovement.count({ where: this.buildWhere(filters) })
  }

  async listByProduct(productId: number, type?: MovementType, skip = 0, limit = 20): Promise<StockMovement[]> {
    return prisma.stockMovement.findMany({
      where: { productId, ...(type ? { type } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { supplier: { select: { id: true, name: true } } },
      skip,
      take: limit,
    })
  }

  async countByProduct(productId: number, type?: MovementType): Promise<number> {
    return prisma.stockMovement.count({ where: { productId, ...(type ? { type } : {}) } })
  }

  async listByClient(clientId: number, type?: MovementType, skip = 0, limit = 20): Promise<StockMovement[]> {
    return prisma.stockMovement.findMany({
      where: { clientId, ...(type ? { type } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { id: true, name: true } } },
      skip,
      take: limit,
    })
  }

  async countByClient(clientId: number, type?: MovementType): Promise<number> {
    return prisma.stockMovement.count({ where: { clientId, ...(type ? { type } : {}) } })
  }

  async countInRange(from: Date, to: Date): Promise<number> {
    return prisma.stockMovement.count({ where: { createdAt: { gte: from, lt: to } } })
  }

  async sumQuantitiesByProduct(type: MovementType, limit: number): Promise<{ productId: number; totalQuantity: number }[]> {
    const rows = await prisma.stockMovement.groupBy({
      by: ['productId'],
      where: { type },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    })
    return rows.map((r) => ({ productId: r.productId, totalQuantity: r._sum.quantity ?? 0 }))
  }
}

export const stockMovementRepository: StockMovementRepository = new PrismaStockMovementRepository()