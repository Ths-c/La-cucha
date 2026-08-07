import { AppError } from '../utils/app-error'
import { ERROR_CODES } from '../constants/errors'
import type { Category } from '@prisma/client'
import type { CategoryRepository } from '../repositories/category.repository'
import type { CreateCategoryInput, UpdateCategoryInput } from '../schemas/category'

export interface CategoryServiceDeps {
  categoryRepository: CategoryRepository
}

export class CategoryService {
  constructor(private readonly deps: CategoryServiceDeps) {}

  async list(): Promise<Category[]> {
    return this.deps.categoryRepository.list()
  }

  async get(id: number): Promise<Category> {
    const category = await this.deps.categoryRepository.findById(id)
    if (!category) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Categoría no encontrada')
    }
    return category
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    const name = normalizeName(input.name)
    const existing = await this.deps.categoryRepository.findByName(name)
    if (existing) {
      throw new AppError(409, ERROR_CODES.DUPLICATE_ENTRY, 'Ya existe una categoría con ese nombre')
    }
    return this.deps.categoryRepository.create({ name })
  }

  async update(id: number, input: UpdateCategoryInput): Promise<Category> {
    await this.get(id)
    const name = normalizeName(input.name)
    const existing = await this.deps.categoryRepository.findByName(name)
    if (existing && existing.id !== id) {
      throw new AppError(409, ERROR_CODES.DUPLICATE_ENTRY, 'Ya existe una categoría con ese nombre')
    }
    const updated = await this.deps.categoryRepository.update(id, { name })
    if (!updated) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Categoría no encontrada')
    }
    return updated
  }

  async delete(id: number): Promise<void> {
    await this.get(id)
    // Se impide borrar categorías referenciadas para no romper relaciones históricas.
    const referenced = await this.deps.categoryRepository.isReferenced(id)
    if (referenced) {
      throw new AppError(
        409,
        ERROR_CODES.CATEGORY_IN_USE,
        'No se puede eliminar la categoría porque tiene productos asociados',
      )
    }
    await this.deps.categoryRepository.delete(id)
  }
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}