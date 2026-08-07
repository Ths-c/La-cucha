/** Tipos de dominio que reflejan las respuestas del backend (docs/api.md). */

export type ProductStatus = 'ACTIVE' | 'INACTIVE'
export type SupplierStatus = 'ACTIVE' | 'INACTIVE'
export type SupplierProductStatus = 'ACTIVE' | 'INACTIVE'

export type MovementType =
  | 'BUY'
  | 'SALE'
  | 'BREAKAGE'
  | 'EXPIRY'
  | 'DONATION'
  | 'INTERNAL_CONSUMPTION'
  | 'MANUAL_ADJUST'

export interface Category {
  id: number
  name: string
  createdAt: string
  updatedAt: string
}

export interface Supplier {
  id: number
  name: string
  whatsappNumber: string
  notes: string | null
  status: SupplierStatus
  createdAt: string
  updatedAt: string
}

export interface CategoryRef {
  id: number
  name: string
}

export interface SupplierRef {
  id: number
  name: string
}

export interface Product {
  id: number
  name: string
  categoryId: number
  supplierId: number | null
  stock: number
  stockMin: number
  status: ProductStatus
  imageUrl: string | null
  createdAt: string
  updatedAt: string
  category: CategoryRef
  supplier: SupplierRef | null
}

export interface SupplierProduct {
  id: number
  supplierId: number
  name: string
  notes: string | null
  categoryId: number | null
  status: SupplierProductStatus
  createdAt: string
  updatedAt: string
  category: CategoryRef | null
}

export interface Movement {
  id: number
  productId: number
  type: MovementType
  quantity: number
  stockBefore: number
  stockAfter: number
  supplierId: number | null
  note: string | null
  createdAt: string
  product: { id: number; name: string }
  supplier: SupplierRef | null
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface StockAdjustmentResult {
  product: { id: number; name: string; stock: number; stockMin: number }
  movement: {
    id: number
    type: MovementType
    quantity: number
    previousStock: number
    resultingStock: number
    note: string | null
    createdAt: string
  }
}

export interface DashboardSummary {
  activeProducts: number
  lowStockCount: number
  movementsThisMonth: number
  lowestStock: LowStockProduct[]
  lowStockProducts: LowStockProduct[]
  topPurchased: TopPurchasedProduct[]
}

export interface LowStockProduct {
  id: number
  name: string
  stock: number
  stockMin: number
  supplier: SupplierRef | null
}

export interface TopPurchasedProduct {
  id: number
  name: string
  totalQuantity: number
}

export interface OrderItemInput {
  supplierProductId: number
  quantity: number
}

export interface OrderPreview {
  supplierId: number
  supplierName: string
  whatsappNumber: string
  items: { name: string; quantity: number }[]
  note?: string
  message: string
  whatsappUrl: string
}

export interface ProductListParams {
  page?: number
  limit?: number
  search?: string
  categoryId?: number
  supplierId?: number
  status?: ProductStatus
  lowStock?: boolean
}

export interface SupplierListParams {
  page?: number
  limit?: number
  search?: string
  status?: SupplierStatus
}

export interface SupplierProductListParams {
  page?: number
  limit?: number
  search?: string
  categoryId?: number
  status?: SupplierProductStatus
}

export interface MovementListParams {
  page?: number
  limit?: number
  type?: MovementType
  productId?: number
  from?: string
  to?: string
}
