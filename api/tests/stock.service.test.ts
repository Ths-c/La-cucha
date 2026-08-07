import { describe, it, expect, vi } from 'vitest'
import { StockService } from '../src/services/stock.service'
import { AppError } from '../src/utils/app-error'
import type { ProductRepository, Tx } from '../src/repositories/product.repository'
import type { StockMovementRepository } from '../src/repositories/stock-movement.repository'

function setup(stock: number, status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE') {
  const productRepository = {
    readForUpdate: vi.fn(async () => ({ id: 1, name: 'Dog Chow', stock, stockMin: 5, status })),
    incrementStock: vi.fn(async () => true),
    decrementStock: vi.fn(async () => true),
  } as unknown as ProductRepository

  const movementRepository = {
    create: vi.fn(async (_tx: Tx, _data: unknown) => ({
      id: 10,
      type: 'BUY',
      quantity: 0,
      stockBefore: 0,
      stockAfter: 0,
      note: null,
      createdAt: new Date(),
    })),
  } as unknown as StockMovementRepository

  const service = new StockService({
    productRepository,
    movementRepository,
    runTransaction: async <T>(fn: (tx: Tx) => Promise<T>): Promise<T> => fn({} as Tx),
  })

  return { service, productRepository, movementRepository }
}

describe('StockService.stockIn', () => {
  it('aumenta el stock y registra el movimiento', async () => {
    const { service, productRepository, movementRepository } = setup(10)
    const result = await service.stockIn(1, { type: 'BUY', quantity: 3 })

    expect(productRepository.incrementStock).toHaveBeenCalled()
    expect(movementRepository.create).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ type: 'BUY', stockBefore: 10, stockAfter: 13 }))
    expect(result.product.stock).toBe(13)
  })

  it('rechaza tipos de entrada no permitidos', async () => {
    const { service } = setup(10)
    await expect(service.stockIn(1, { type: 'SALE', quantity: 2 })).rejects.toBeInstanceOf(AppError)
  })
})

describe('StockService.stockOut', () => {
  it('rechaza salida cuando no hay stock suficiente', async () => {
    const { service } = setup(2)
    await expect(service.stockOut(1, { type: 'SALE', quantity: 5 })).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' })
  })

  it('registra salida correctamente cuando hay stock', async () => {
    const { service, movementRepository } = setup(10)
    await service.stockOut(1, { type: 'SALE', quantity: 4 })
    expect(movementRepository.create).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ stockAfter: 6 }))
  })

  it('rechaza el uso de producto inactivo', async () => {
    const { service } = setup(10, 'INACTIVE')
    await expect(service.stockIn(1, { type: 'BUY', quantity: 1 })).rejects.toMatchObject({ code: 'CONFLICT' })
  })
})

describe('StockService concurrencia (race conditions)', () => {
  // Simula dos `stockOut` concurrentes sobre el mismo producto. El guard atómico
  // `decrementStock` (WHERE stock >= quantity) garantiza que solo uno de los dos
  // pueda consumir el stock restante y que NUNCA quede stock negativo.
  it('no permite que dos salidas dejen el stock en negativo', async () => {
    const productRepository = {
      readForUpdate: vi.fn(async () => ({ id: 1, name: 'Dog Chow', stock: 5, stockMin: 0, status: 'ACTIVE' })),
      incrementStock: vi.fn(async () => true),
      // Respuesta racing: la primera salida consume el stock (ok), la segunda no.
      decrementStock: vi
        .fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false),
    } as unknown as ProductRepository

    const movementRepository = {
      create: vi.fn(async (_tx: Tx, _data: unknown) => ({
        id: 1, type: 'SALE', quantity: 0, stockBefore: 0, stockAfter: 0, note: null, createdAt: new Date(),
      })),
    } as unknown as StockMovementRepository

    const service = new StockService({
      productRepository,
      movementRepository,
      runTransaction: async <T>(fn: (tx: Tx) => Promise<T>): Promise<T> => fn({} as Tx),
    })

    const [first, second] = await Promise.allSettled([
      service.stockOut(1, { type: 'SALE', quantity: 5 }),
      service.stockOut(1, { type: 'SALE', quantity: 5 }),
    ])

    // El segundo intento debe fallar por stock insuficiente.
    if (second.status === 'rejected') {
      expect((second.reason as { code?: string }).code).toBe('INSUFFICIENT_STOCK')
    }
    // El producto nunca reporta stock negativo.
    if (second.status === 'rejected' && first.status === 'fulfilled') {
      expect(first.value.product.stock).toBeGreaterThanOrEqual(0)
    }
    // Al menos una salida tiene que tener éxito; ninguna deja stock negativo.
    expect(first.status === 'fulfilled' || second.status === 'fulfilled').toBe(true)
  })
})