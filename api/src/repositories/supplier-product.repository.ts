import type { Prisma, SupplierProduct, SupplierProductStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'

export interface SupplierProductListFilters {
  search?: string
  categoryId?: number
  status?: SupplierProductStatus
  skip: number
  limit: number
}

export type SupplierProductWithRelations = SupplierProduct & {
  category: { id: number; name: string } | null
}

export interface SupplierProductRepository {
  findById(id: number): Promise<SupplierProduct | null>
  findByIdsForSupplier(supplierId: number, ids: number[]): Promise<SupplierProduct[]>
  findBySupplierAndName(supplierId: number, name: string): Promise<SupplierProduct | null>
  list(supplierId: number, filters: SupplierProductListFilters): Promise<SupplierProductWithRelations[]>
  count(supplierId: number, filters: Omit<SupplierProductListFilters, 'skip' | 'limit'>): Promise<number>
create(supplierId: number, data: Omit<Prisma.SupplierProductUncheckedCreateInput, 'supplierId'>): Promise<SupplierProduct>
  update(id: number, data: Prisma.SupplierProductUncheckedUpdateInput): Promise<SupplierProduct | null>
}

class PrismaSupplierProductRepository implements SupplierProductRepository {
  private buildWhere(
    supplierId: number,
    filters: Omit<SupplierProductListFilters, 'skip' | 'limit'>,
  ): Prisma.SupplierProductWhereInput {
    const where: Prisma.SupplierProductWhereInput = { supplierId }
    if (filters.search) where.name = { contains: filters.search, mode: 'insensitive' }
    if (filters.categoryId !== undefined) where.categoryId = filters.categoryId
    if (filters.status !== undefined) where.status = filters.status
    return where
  }

  async findById(id: number): Promise<SupplierProduct | null> {
    return prisma.supplierProduct.findUnique({ where: { id } })
  }

  async findByIdsForSupplier(supplierId: number, ids: number[]): Promise<SupplierProduct[]> {
    if (ids.length === 0) return []
    return prisma.supplierProduct.findMany({ where: { id: { in: ids }, supplierId } })
  }

  async findBySupplierAndName(supplierId: number, name: string): Promise<SupplierProduct | null> {
    return prisma.supplierProduct.findFirst({
      where: { supplierId, name: { equals: name, mode: 'insensitive' } },
    })
  }

  async list(supplierId: number, filters: SupplierProductListFilters): Promise<SupplierProductWithRelations[]> {
    const items = await prisma.supplierProduct.findMany({
      where: this.buildWhere(supplierId, filters),
      include: { category: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
      skip: filters.skip,
      take: filters.limit,
    })
    return items as SupplierProductWithRelations[]
  }

  async count(supplierId: number, filters: Omit<SupplierProductListFilters, 'skip' | 'limit'>): Promise<number> {
    return prisma.supplierProduct.count({ where: this.buildWhere(supplierId, filters) })
  }

  async create(
    supplierId: number,
    data: Omit<Prisma.SupplierProductUncheckedCreateInput, 'supplierId'>,
  ): Promise<SupplierProduct> {
    return prisma.supplierProduct.create({ data: { ...data, supplierId } })
  }

  async update(id: number, data: Prisma.SupplierProductUncheckedUpdateInput): Promise<SupplierProduct | null> {
    return prisma.supplierProduct.update({ where: { id }, data })
  }
}

export const supplierProductRepository: SupplierProductRepository = new PrismaSupplierProductRepository()