import type { Prisma, Client, ClientStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'

export interface ClientListFilters {
  search?: string
  status?: ClientStatus
  skip: number
  limit: number
}

export interface ClientRepository {
  findById(id: number): Promise<Client | null>
  list(filters: ClientListFilters): Promise<Client[]>
  count(filters: Omit<ClientListFilters, 'skip' | 'limit'>): Promise<number>
  create(data: Prisma.ClientUncheckedCreateInput): Promise<Client>
  update(id: number, data: Prisma.ClientUncheckedUpdateInput): Promise<Client | null>
}

class PrismaClientRepository implements ClientRepository {
  private buildWhere(filters: Omit<ClientListFilters, 'skip' | 'limit'>): Prisma.ClientWhereInput {
    const where: Prisma.ClientWhereInput = {}
    if (filters.search) where.name = { contains: filters.search, mode: 'insensitive' }
    if (filters.status !== undefined) where.status = filters.status
    return where
  }

  async findById(id: number): Promise<Client | null> {
    return prisma.client.findUnique({ where: { id } })
  }

  async list(filters: ClientListFilters): Promise<Client[]> {
    return prisma.client.findMany({
      where: this.buildWhere(filters),
      orderBy: { name: 'asc' },
      skip: filters.skip,
      take: filters.limit,
    })
  }

  async count(filters: Omit<ClientListFilters, 'skip' | 'limit'>): Promise<number> {
    return prisma.client.count({ where: this.buildWhere(filters) })
  }

  async create(data: Prisma.ClientUncheckedCreateInput): Promise<Client> {
    return prisma.client.create({ data })
  }

  async update(id: number, data: Prisma.ClientUncheckedUpdateInput): Promise<Client | null> {
    return prisma.client.update({ where: { id }, data })
  }
}

export const clientRepository: ClientRepository = new PrismaClientRepository()
