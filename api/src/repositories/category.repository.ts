import type { Category, Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'

export interface CategoryRepository {
  findById(id: number): Promise<Category | null>
  findByName(name: string): Promise<Category | null>
  list(): Promise<Category[]>
  create(data: Prisma.CategoryUncheckedCreateInput): Promise<Category>
  update(id: number, data: Prisma.CategoryUncheckedUpdateInput): Promise<Category | null>
  // Retorna true si la categoría está referenciada (no debe borrarse).
  isReferenced(id: number): Promise<boolean>
  delete(id: number): Promise<void>
}

class PrismaCategoryRepository implements CategoryRepository {
  async findById(id: number): Promise<Category | null> {
    return prisma.category.findUnique({ where: { id } })
  }

  async findByName(name: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { name } })
  }

  async list(): Promise<Category[]> {
    return prisma.category.findMany({ orderBy: { name: 'asc' } })
  }

  async create(data: Prisma.CategoryUncheckedCreateInput): Promise<Category> {
    return prisma.category.create({ data })
  }

  async update(id: number, data: Prisma.CategoryUncheckedUpdateInput): Promise<Category> {
    return prisma.category.update({ where: { id }, data })
  }

  async isReferenced(id: number): Promise<boolean> {
    const [products, supplierProducts] = await Promise.all([
      prisma.product.count({ where: { categoryId: id } }),
      prisma.supplierProduct.count({ where: { categoryId: id } }),
    ])
    return products > 0 || supplierProducts > 0
  }

  async delete(id: number): Promise<void> {
    await prisma.category.delete({ where: { id } })
  }
}

export const categoryRepository: CategoryRepository = new PrismaCategoryRepository()