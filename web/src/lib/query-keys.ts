/** Claves de caché centralizadas para TanStack Query. */
export const qk = {
  categories: ['categories'] as const,
  dashboard: ['dashboard'] as const,
  products: (params?: object) =>
    ['products', params ?? 'all'] as const,
  product: (id: number) => ['products', id] as const,
  productMovements: (id: number) => ['products', id, 'movements'] as const,
  suppliers: (params?: object) =>
    ['suppliers', params ?? 'all'] as const,
  supplier: (id: number) => ['suppliers', id] as const,
  clients: (params?: object) =>
    ['clients', params ?? 'all'] as const,
  client: (id: number) => ['clients', id] as const,
  clientPurchases: (id: number, params?: object) =>
    ['clients', id, 'purchases', params ?? 'all'] as const,
  supplierProducts: (id: number, params?: object) =>
    ['suppliers', id, 'products', params ?? 'all'] as const,
  trash: ['trash'] as const,
  movements: (params?: object) => ['movements', params ?? 'all'] as const,
  orderPreview: ['orders', 'preview'] as const,
}