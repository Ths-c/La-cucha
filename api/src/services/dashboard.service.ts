import type { ProductRepository, ProductWithRelations } from '../repositories/product.repository'
import type { StockMovementRepository } from '../repositories/stock-movement.repository'
import { getMonthRange } from '../utils/timezone'
import { logger } from '../utils/logger'

export interface DashboardSummary {
  activeProducts: number
  lowStockCount: number
  movementsThisMonth: number
  lowestStock: LowestStockProduct[]
  lowStockProducts: LowStockProduct[]
  topPurchased: TopPurchasedProduct[]
}

export interface LowestStockProduct {
  id: number
  name: string
  stock: number
  stockMin: number
  unit: 'UNITS' | 'KG'
  supplier: { id: number; name: string } | null
}

export interface LowStockProduct {
  id: number
  name: string
  stock: number
  stockMin: number
  unit: 'UNITS' | 'KG'
  supplier: { id: number; name: string } | null
}

export interface TopPurchasedProduct {
  id: number
  name: string
  unit: 'UNITS' | 'KG'
  totalQuantity: number
}

export interface DashboardServiceDeps {
  productRepository: ProductRepository
  movementRepository: StockMovementRepository
  timezone: string
  topPurchasedLimit?: number
  lowStockLimit?: number
  lowestStockLimit?: number
}

export class DashboardService {
  constructor(private readonly deps: DashboardServiceDeps) {}

  async summary(): Promise<DashboardSummary> {
    const timezone = this.deps.timezone?.trim() || 'America/Argentina/Buenos_Aires'
    const { start, end } = getMonthRange(timezone)

    const [activeProducts, lowStockCount, movementsThisMonth, lowStockIds, topPurchased] =
      await Promise.all([
        this.step('countByStatus', () => this.deps.productRepository.countByStatus('ACTIVE')),
        this.step('countLowStock', () => this.deps.productRepository.countLowStock()),
        this.step('countInRange', () => this.deps.movementRepository.countInRange(start, end)),
        this.step('listLowStockIds', () =>
          this.deps.productRepository.listLowStockIds(this.deps.lowStockLimit ?? 5),
        ),
        this.step('sumQuantitiesByProduct', () =>
          this.deps.movementRepository.sumQuantitiesByProduct('BUY', this.deps.topPurchasedLimit ?? 5),
        ),
      ])

    const [lowStockProducts, lowestStock, topProductsByIds] = await Promise.all([
      this.step('fetchLowStockProducts', () => this.fetchLowStockProducts(lowStockIds)),
      this.step('fetchLowestStock', () => this.fetchLowestStock()),
      this.step('findTopProducts', () =>
        this.deps.productRepository.findByIdsWithRelations(topPurchased.map((t) => t.productId)),
      ),
    ])

    return {
      activeProducts,
      lowStockCount,
      movementsThisMonth,
      lowStockProducts,
      lowestStock,
      topPurchased: topPurchased
        .map((t) => {
          const product = topProductsByIds.find((p) => p.id === t.productId)
          return { id: t.productId, name: product?.name ?? 'Producto', unit: (product?.unit ?? 'UNITS') as 'UNITS' | 'KG', totalQuantity: t.totalQuantity }
        }),
    }
  }

  // Envuelve cada sub-query para saber cuál rompe el /summary en los logs
  // de Render (antes el Promise.all fallaba sin decir qué paso falló).
  private async step<T>(name: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn()
    } catch (err) {
      logger.error('dashboard_summary_step_failed', {
        step: name,
        name_: err instanceof Error ? err.name : typeof err,
        message: err instanceof Error ? err.message.slice(0, 500) : String(err).slice(0, 500),
        code: (err as { code?: unknown })?.code ?? undefined,
        meta: (err as { meta?: unknown })?.meta ?? undefined,
      })
      throw err
    }
  }

  private async fetchLowestStock(): Promise<LowestStockProduct[]> {
    const products = await this.deps.productRepository.list({
      status: 'ACTIVE',
      skip: 0,
      limit: this.deps.lowestStockLimit ?? 5,
      orderBy: [{ stock: 'asc' }, { name: 'asc' }],
    })
    return products.map(toLowestStock)
  }

  private async fetchLowStockProducts(ids: number[]): Promise<LowStockProduct[]> {
    const products = await this.deps.productRepository.findByIdsWithRelations(ids)
    return products.map(toLowStock)
  }
}

function toLowStock(p: ProductWithRelations): LowStockProduct {
  return { id: p.id, name: p.name, stock: p.stock, stockMin: p.stockMin, unit: p.unit as 'UNITS' | 'KG', supplier: p.supplier }
}

function toLowestStock(p: ProductWithRelations): LowestStockProduct {
  return { id: p.id, name: p.name, stock: p.stock, stockMin: p.stockMin, unit: p.unit as 'UNITS' | 'KG', supplier: p.supplier }
}