import type { ProductRepository, ProductWithRelations } from '../repositories/product.repository'
import type { StockMovementRepository } from '../repositories/stock-movement.repository'
import { getMonthRange } from '../utils/timezone'

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
  supplier: { id: number; name: string } | null
}

export interface LowStockProduct {
  id: number
  name: string
  stock: number
  stockMin: number
  supplier: { id: number; name: string } | null
}

export interface TopPurchasedProduct {
  id: number
  name: string
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
    const { start, end } = getMonthRange(this.deps.timezone)

    const [activeProducts, lowStockCount, movementsThisMonth, lowStockIds, topPurchased] =
      await Promise.all([
        this.deps.productRepository.countByStatus('ACTIVE'),
        this.deps.productRepository.countLowStock(),
        this.deps.movementRepository.countInRange(start, end),
        this.deps.productRepository.listLowStockIds(this.deps.lowStockLimit ?? 5),
        this.deps.movementRepository.sumQuantitiesByProduct('BUY', this.deps.topPurchasedLimit ?? 5),
      ])

    const [lowStockProducts, lowestStock, topProductsByIds] = await Promise.all([
      this.fetchLowStockProducts(lowStockIds),
      this.fetchLowestStock(),
      this.deps.productRepository.findByIdsWithRelations(topPurchased.map((t) => t.productId)),
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
          return { id: t.productId, name: product?.name ?? 'Producto', totalQuantity: t.totalQuantity }
        }),
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
  return { id: p.id, name: p.name, stock: p.stock, stockMin: p.stockMin, supplier: p.supplier }
}

function toLowestStock(p: ProductWithRelations): LowestStockProduct {
  return { id: p.id, name: p.name, stock: p.stock, stockMin: p.stockMin, supplier: p.supplier }
}