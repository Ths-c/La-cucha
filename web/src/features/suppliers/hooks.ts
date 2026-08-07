import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supplierApi } from '@/services/api'
import type {
  CreateSupplierInput,
  CreateSupplierProductInput,
  UpdateSupplierInput,
  UpdateSupplierProductInput,
} from '@/services/api'
import type { SupplierListParams, SupplierProductListParams } from '@/types/domain'
import { qk } from '@/lib/query-keys'

export function useSuppliers(params: SupplierListParams) {
  return useQuery({
    queryKey: qk.suppliers(params),
    queryFn: () => supplierApi.list(params),
    placeholderData: (prev) => prev,
  })
}

export function useSupplier(id: number) {
  return useQuery({
    queryKey: qk.supplier(id),
    queryFn: () => supplierApi.get(id),
    enabled: id > 0,
  })
}

export function useSupplierProducts(id: number, params: SupplierProductListParams) {
  return useQuery({
    queryKey: qk.supplierProducts(id, params),
    queryFn: () => supplierApi.products(id, params),
    enabled: id > 0,
    placeholderData: (prev) => prev,
  })
}

export function useCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSupplierInput) => supplierApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.suppliers() }),
  })
}

export function useUpdateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateSupplierInput }) =>
      supplierApi.update(id, input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: qk.suppliers() })
      qc.invalidateQueries({ queryKey: qk.supplier(vars.id) })
    },
  })
}

export function useDeactivateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => supplierApi.deactivate(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: qk.suppliers() })
      qc.invalidateQueries({ queryKey: qk.supplier(id) })
      qc.invalidateQueries({ queryKey: qk.trash })
    },
  })
}

export function useRestoreSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => supplierApi.restore(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: qk.suppliers() })
      qc.invalidateQueries({ queryKey: qk.supplier(id) })
      qc.invalidateQueries({ queryKey: qk.trash })
    },
  })
}

export function useCreateSupplierProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ supplierId, input }: { supplierId: number; input: CreateSupplierProductInput }) =>
      supplierApi.createProduct(supplierId, input),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: qk.supplierProducts(vars.supplierId) }),
  })
}

export function useUpdateSupplierProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      supplierId,
      itemId,
      input,
    }: {
      supplierId: number
      itemId: number
      input: UpdateSupplierProductInput
    }) => supplierApi.updateProduct(supplierId, itemId, input),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: qk.supplierProducts(vars.supplierId) }),
  })
}

export function useDeactivateSupplierProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ supplierId, itemId }: { supplierId: number; itemId: number }) =>
      supplierApi.deactivateProduct(supplierId, itemId),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: qk.supplierProducts(vars.supplierId) }),
  })
}