import { apiFetch } from '@/lib/api/client'
import type {
  Category,
  DashboardSummary,
  Movement,
  MovementListParams,
  MovementType,
  OrderItemInput,
  OrderPreview,
  Paginated,
  Product,
  ProductListParams,
  Supplier,
  SupplierListParams,
  SupplierProduct,
  SupplierProductListParams,
} from '@/types/domain'

// ────────────────────────────── Inputs ──────────────────────────────

export interface CreateProductInput {
  name: string
  categoryId: number
  supplierId?: number | null
  stock?: number
  stockMin?: number
  imageUrl?: string
}

export interface UpdateProductInput {
  name?: string
  categoryId?: number
  supplierId?: number | null
  stockMin?: number
  status?: 'ACTIVE' | 'INACTIVE'
  imageUrl?: string | null
}

export interface StockInInput {
  type: 'BUY' | 'MANUAL_ADJUST'
  quantity: number
  supplierId?: number | null
  note?: string
}

export interface StockOutInput {
  type: Exclude<MovementType, 'BUY'>
  quantity: number
  supplierId?: number | null
  note?: string
}

export interface CreateSupplierInput {
  name: string
  whatsappNumber: string
  notes?: string
}

export interface UpdateSupplierInput {
  name?: string
  whatsappNumber?: string
  notes?: string | null
  status?: 'ACTIVE' | 'INACTIVE'
}

export interface CreateSupplierProductInput {
  name: string
  notes?: string
  categoryId?: number | null
}

export interface UpdateSupplierProductInput {
  name?: string
  notes?: string | null
  categoryId?: number | null
  status?: 'ACTIVE' | 'INACTIVE'
}

export interface CreateCategoryInput {
  name: string
}

// ────────────────────────────── Productos ──────────────────────────────

export const productApi = {
  list: (params: ProductListParams) => apiFetch<Paginated<Product>>('/products', { query: params }),
  trash: (params: ProductListParams) => apiFetch<Paginated<Product>>('/products/trash', { query: params }),
  get: (id: number) => apiFetch<Product>(`/products/${id}`),
  create: (input: CreateProductInput) =>
    apiFetch<Product>('/products', { method: 'POST', body: input }),
  update: (id: number, input: UpdateProductInput) =>
    apiFetch<Product>(`/products/${id}`, { method: 'PATCH', body: input }),
  deactivate: (id: number) => apiFetch<Product>(`/products/${id}`, { method: 'DELETE' }),
  restore: (id: number) => apiFetch<Product>(`/products/${id}/restore`, { method: 'POST' }),
  stockIn: (id: number, input: StockInInput) =>
    apiFetch<import('@/types/domain').StockAdjustmentResult>(`/products/${id}/stock/in`, {
      method: 'POST',
      body: input,
    }),
  stockOut: (id: number, input: StockOutInput) =>
    apiFetch<import('@/types/domain').StockAdjustmentResult>(`/products/${id}/stock/out`, {
      method: 'POST',
      body: input,
    }),
  movements: (id: number, params: { page?: number; limit?: number; type?: MovementType }) =>
    apiFetch<Paginated<Movement>>(`/products/${id}/movements`, { query: params }),
}

// ────────────────────────────── Categorías ──────────────────────────────

export const categoryApi = {
  list: () => apiFetch<Category[]>('/categories'),
  create: (input: CreateCategoryInput) => apiFetch<Category>('/categories', { method: 'POST', body: input }),
  update: (id: number, input: CreateCategoryInput) =>
    apiFetch<Category>(`/categories/${id}`, { method: 'PATCH', body: input }),
  delete: (id: number) => apiFetch<void>(`/categories/${id}`, { method: 'DELETE' }),
}

// ────────────────────────────── Proveedores ──────────────────────────────

export const supplierApi = {
  list: (params: SupplierListParams) => apiFetch<Paginated<Supplier>>('/suppliers', { query: params }),
  trash: (params: SupplierListParams) => apiFetch<Paginated<Supplier>>('/suppliers/trash', { query: params }),
  get: (id: number) => apiFetch<Supplier>(`/suppliers/${id}`),
  create: (input: CreateSupplierInput) => apiFetch<Supplier>('/suppliers', { method: 'POST', body: input }),
  update: (id: number, input: UpdateSupplierInput) =>
    apiFetch<Supplier>(`/suppliers/${id}`, { method: 'PATCH', body: input }),
  deactivate: (id: number) => apiFetch<Supplier>(`/suppliers/${id}`, { method: 'DELETE' }),
  restore: (id: number) => apiFetch<Supplier>(`/suppliers/${id}/restore`, { method: 'POST' }),
  products: (id: number, params: SupplierProductListParams) =>
    apiFetch<Paginated<SupplierProduct>>(`/suppliers/${id}/products`, { query: params }),
  createProduct: (id: number, input: CreateSupplierProductInput) =>
    apiFetch<SupplierProduct>(`/suppliers/${id}/products`, { method: 'POST', body: input }),
  updateProduct: (id: number, itemId: number, input: UpdateSupplierProductInput) =>
    apiFetch<SupplierProduct>(`/suppliers/${id}/products/${itemId}`, { method: 'PATCH', body: input }),
  deactivateProduct: (id: number, itemId: number) =>
    apiFetch<SupplierProduct>(`/suppliers/${id}/products/${itemId}`, { method: 'DELETE' }),
}

// ────────────────────────────── Movimientos ──────────────────────────────

export const movementApi = {
  list: (params: MovementListParams) => apiFetch<Paginated<Movement>>('/movements', { query: params }),
}

// ────────────────────────────── Dashboard ──────────────────────────────

export const dashboardApi = {
  summary: () => apiFetch<DashboardSummary>('/dashboard/summary'),
}

// ────────────────────────────── Órdenes ──────────────────────────────

export const orderApi = {
  preview: (supplierId: number, items: OrderItemInput[], note?: string) =>
    apiFetch<OrderPreview>('/orders/preview', {
      method: 'POST',
      body: { supplierId, items, ...(note ? { note } : {}) },
    }),
}