import { describe, it, expect, vi } from 'vitest'
import { ProductService } from '../src/services/product.service'
import { AppError } from '../src/utils/app-error'
import type { ProductRepository } from '../src/repositories/product.repository'
import type { CategoryRepository } from '../src/repositories/category.repository'
import type { SupplierRepository } from '../src/repositories/supplier.repository'
import type { StockService } from '../src/services/stock.service'

function setup() {
  const productRepository = {
    findById: vi.fn(async () => null),
    findByIdWithRelations: vi.fn(async (id: number) => ({ id, name: 'X', stock: 0, stockMin: 0 })),
    create: vi.fn(async (data) => ({ id: 1, ...data })),
    update: vi.fn(async (_id: number, data: unknown) => ({ id: 1, ...(data as object) })),
    list: vi.fn(async () => []),
    count: vi.fn(async () => 0),
  } as unknown as ProductRepository

  const categoryRepository = {
    findById: vi.fn(async () => ({ id: 1, name: 'Alimentos' })),
  } as unknown as CategoryRepository

  const supplierRepository = {
    findById: vi.fn(async () => null),
  } as unknown as SupplierRepository

  const stockService = { stockIn: vi.fn(async () => ({})) } as unknown as StockService

  const service = new ProductService({ productRepository, categoryRepository, supplierRepository, stockService })
  return { service, productRepository, categoryRepository, supplierRepository, stockService }
}

describe('ProductService.create', () => {
  it('registra stock inicial como movimiento BUY', async () => {
    const { service, stockService } = setup()
    await service.create({ name: 'Arena', categoryId: 1, stock: 5 })
    expect(stockService.stockIn).toHaveBeenCalledWith(1, { type: 'BUY', quantity: 5, note: 'Stock inicial' })
  })

  it('no registra movimiento si el stock inicial es 0', async () => {
    const { service, stockService } = setup()
    await service.create({ name: 'Juguete', categoryId: 1, stock: 0 })
    expect(stockService.stockIn).not.toHaveBeenCalled()
  })

  it('lanza error si la categoría no existe', async () => {
    const { service, categoryRepository } = setup()
    categoryRepository.findById.mockResolvedValueOnce(null)
    await expect(service.create({ name: 'X', categoryId: 999 })).rejects.toBeInstanceOf(AppError)
  })
})

describe('ProductService.trash', () => {
  it('lista productos INACTIVE', async () => {
    const { service } = setup()
    const result = await service.trash()
    expect(result).toBeDefined()
  })
})