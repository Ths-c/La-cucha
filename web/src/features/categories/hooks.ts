import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { categoryApi } from '@/services/api'
import type { CreateCategoryInput } from '@/services/api'
import { qk } from '@/lib/query-keys'

export function useCategories() {
  return useQuery({
    queryKey: qk.categories,
    queryFn: categoryApi.list,
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => categoryApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories }),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CreateCategoryInput }) => categoryApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => categoryApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories }),
  })
}