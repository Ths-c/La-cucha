import type { Prisma, Supplier, SupplierStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'

export interface SupplierListFilters {
  search?: string
  status?: SupplierStatus
  skip: number
  limit: number
}

export interface SupplierRepository {
  findById(id: number): Promise<Supplier | null>
  findByWhatsappNumber(whatsappNumber: string): Promise<Supplier | null>
  list(filters: SupplierListFilters): Promise<Supplier[]>
  count(filters: Omit<SupplierListFilters, 'skip' | 'limit'>): Promise<number>
  create(data: Prisma.SupplierUncheckedCreateInput): Promise<Supplier>
  update(id: number, data: Prisma.SupplierUncheckedUpdateInput): Promise<Supplier | null>
}

class PrismaSupplierRepository implements SupplierRepository {
  private buildWhere(filters: Omit<SupplierListFilters, 'skip' | 'limit'>): Prisma.SupplierWhereInput {
    const where: Prisma.SupplierWhereInput = {}
    if (filters.search) where.name = { contains: filters.search, mode: 'insensitive' }
    if (filters.status !== undefined) where.status = filters.status
    return where
  }

  async findById(id: number): Promise<Supplier | null> {
    return prisma.supplier.findUnique({ where: { id } })
  }

  async findByWhatsappNumber(whatsappNumber: string): Promise<Supplier | null> {
    return prisma.supplier.findFirst({ where: { whatsappNumber } })
  }

  async list(filters: SupplierListFilters): Promise<Supplier[]> {
    return prisma.supplier.findMany({
      where: this.buildWhere(filters),
      orderBy: { name: 'asc' },
      skip: filters.skip,
      take: filters.limit,
    })
  }

  async count(filters: Omit<SupplierListFilters, 'skip' | 'limit'>): Promise<number> {
    return prisma.supplier.count({ where: this.buildWhere(filters) })
  }

  async create(data: Prisma.SupplierUncheckedCreateInput): Promise<Supplier> {
    return prisma.supplier.create({ data })
  }

  async update(id: number, data: Prisma.SupplierUncheckedUpdateInput): Promise<Supplier | null> {
    return prisma.supplier.update({ where: { id }, data })
  }
}

export const supplierRepository: SupplierRepository = new PrismaSupplierRepository()