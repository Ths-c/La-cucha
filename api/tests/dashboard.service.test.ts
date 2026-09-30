import { describe, it, expect, vi } from 'vitest'
import { DashboardService } from '../src/services/dashboard.service'
import { getMonthRange } from '../src/utils/timezone'
import type { ProductRepository } from '../src/repositories/product.repository'
import type { StockMovementRepository } from '../src/repositories/stock-movement.repository'

function setup(overrides: {
  products?: Array<{ id: number; name: string; stock: number; stockMin: number; unit: 'UNITS' | 'KG' }>
  topPurchased?: Array<{ productId: number; totalQuantity: number }>
  failStep?: string
} = {}) {
  const products = overrides.products ?? [
    { id: 1, name: 'Dog Chow 15kg', stock: 2, stockMin: 5, unit: 'UNITS' as const },
    { id: 2, name: 'Suelto x kg', stock: 10.5, stockMin: 3, unit: 'KG' as const },
  ]
  const byId = new Map(products.map((p) => [p.id, p]))

  const fail = <T extends unknown[], R>(step: string, fn: (...args: T) => Promise<R>) =>
    async (...args: T): Promise<R> => {
      if (overrides.failStep === step) throw Object.assign(new Error(`boom:${step}`), { code: 'P2022' })
      return fn(...args)
    }

  const productRepository = {
    countByStatus: vi.fn(fail('countByStatus', async () => products.length)),
    countLowStock: vi.fn(fail('countLowStock', async () => products.filter((p) => p.stock < p.stockMin).length)),
    listLowStockIds: vi.fn(
      fail('listLowStockIds', async (limit?: number) =>
        products.filter((p) => p.stock < p.stockMin).map((p) => p.id).slice(0, limit ?? 5),
      ),
    ),
    findByIdsWithRelations: vi.fn(
      fail('findByIdsWithRelations', async (ids: number[]) =>
        ids
          .map((id) => byId.get(id))
          .filter((p) => p != null)
          .map((p) => ({ ...p, category: { id: 1, name: 'Alimentos' }, supplier: null })),
      ),
    ),
    list: vi.fn(fail('list', async () => products.map((p) => ({ ...p, category: { id: 1, name: 'A' }, supplier: null })))),
  } as unknown as ProductRepository

  const movementRepository = {
    countInRange: vi.fn(fail('countInRange', async () => 7)),
    sumQuantitiesByProduct: vi.fn(
      fail(
        'sumQuantitiesByProduct',
        async () => overrides.topPurchased ?? [{ productId: 1, totalQuantity: 12 }],
      ),
    ),
  } as unknown as StockMovementRepository

  const service = new DashboardService({
    productRepository,
    movementRepository,
    timezone: 'America/Argentina/Buenos_Aires',
  })
  return { service, productRepository, movementRepository }
}

describe('DashboardService.summary', () => {
  it('devuelve resumen con stock bajo y top comprados (UNITS y KG)', async () => {
    const { service } = setup()
    const summary = await service.summary()

    expect(summary.activeProducts).toBe(2)
    expect(summary.lowStockCount).toBe(1)
    expect(summary.movementsThisMonth).toBe(7)
    expect(summary.lowStockProducts).toHaveLength(1)
    expect(summary.lowStockProducts[0]).toMatchObject({ id: 1, unit: 'UNITS' })
    expect(summary.topPurchased).toHaveLength(1)
    expect(summary.topPurchased[0]).toMatchObject({ id: 1, name: 'Dog Chow 15kg', totalQuantity: 12 })
  })

  it('devuelve listas vacías sin productos ni movimientos (no 500)', async () => {
    const { service } = setup({ products: [], topPurchased: [] })
    const summary = await service.summary()

    expect(summary).toMatchObject({
      activeProducts: 0,
      lowStockCount: 0,
      movementsThisMonth: 7,
      lowStockProducts: [],
      topPurchased: [],
    })
    expect(summary.lowestStock).toEqual([])
  })

  it('usa fallback cuando el top referencia un producto inexistente', async () => {
    const { service } = setup({ topPurchased: [{ productId: 999, totalQuantity: 4 }] })
    const summary = await service.summary()

    expect(summary.topPurchased[0]).toMatchObject({ id: 999, name: 'Producto', unit: 'UNITS' })
  })

  it('propaga el error (no lo traga) para que el error-handler lo loguee con el paso', async () => {
    const { service } = setup({ failStep: 'countLowStock' })
    await expect(service.summary()).rejects.toThrow('boom:countLowStock')
  })

  it('acepta timezone vacío usando el default Argentina (no 500)', async () => {
    const { productRepository, movementRepository } = setup()
    const svcEmptyTz = new DashboardService({ productRepository, movementRepository, timezone: '' })
    const summary = await svcEmptyTz.summary()
    expect(summary.activeProducts).toBeGreaterThanOrEqual(0)
  })
})

describe('getMonthRange', () => {
  it('hace fallback a UTC con timezone inválida en vez de lanzar (causa del 500)', () => {
    const ref = new Date(Date.UTC(2026, 8, 15, 12, 0, 0))
    const { start, end } = getMonthRange('Zona/Inventada', ref)
    expect(start).toEqual(new Date(Date.UTC(2026, 8, 1)))
    expect(end).toEqual(new Date(Date.UTC(2026, 9, 1)))
  })

  it('respeta America/Argentina/Buenos_Aires (UTC-3 sin DST)', () => {
    const ref = new Date(Date.UTC(2026, 8, 15, 12, 0, 0))
    const { start, end } = getMonthRange('America/Argentina/Buenos_Aires', ref)
    // Inicio de mes local = 03:00 UTC del día 1.
    expect(start).toEqual(new Date(Date.UTC(2026, 8, 1, 3, 0, 0)))
    expect(end).toEqual(new Date(Date.UTC(2026, 9, 1, 3, 0, 0)))
  })
})
