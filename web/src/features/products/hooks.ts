import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productApi } from '@/services/api'
import type {
  CreateProductInput,
  StockInInput,
  StockOutInput,
  UpdateProductInput,
} from '@/services/api'
import type { ProductListParams } from '@/types/domain'
import { qk } from '@/lib/query-keys'

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: qk.products(params),
    queryFn: () => productApi.list(params),
    placeholderData: (prev) => prev,
  })
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: qk.product(id),
    queryFn: () => productApi.get(id),
    enabled: id > 0,
  })
}

export function useProductMovements(id: number, page: number) {
  return useQuery({
    queryKey: [...qk.productMovements(id), page],
    queryFn: () => productApi.movements(id, { page, limit: 15 }),
    enabled: id > 0,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProductInput) => productApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.products() })
    },
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateProductInput }) =>
      productApi.update(id, input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: qk.products() })
      qc.invalidateQueries({ queryKey: qk.product(vars.id) })
    },
  })
}

export function useDeactivateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => productApi.deactivate(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: qk.products() })
      qc.invalidateQueries({ queryKey: qk.product(id) })
      qc.invalidateQueries({ queryKey: qk.trash })
    },
  })
}

export function useRestoreProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => productApi.restore(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: qk.products() })
      qc.invalidateQueries({ queryKey: qk.product(id) })
      qc.invalidateQueries({ queryKey: qk.trash })
    },
  })
}

export function useStockIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: StockInInput }) => productApi.stockIn(id, input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: qk.products() })
      qc.invalidateQueries({ queryKey: qk.product(vars.id) })
      qc.invalidateQueries({ queryKey: qk.productMovements(vars.id) })
      qc.invalidateQueries({ queryKey: qk.movements() })
      qc.invalidateQueries({ queryKey: qk.dashboard })
    },
  })
}

export function useStockOut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: StockOutInput }) => productApi.stockOut(id, input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: qk.products() })
      qc.invalidateQueries({ queryKey: qk.product(vars.id) })
      qc.invalidateQueries({ queryKey: qk.productMovements(vars.id) })
      qc.invalidateQueries({ queryKey: qk.movements() })
      qc.invalidateQueries({ queryKey: qk.dashboard })
    },
  })
}