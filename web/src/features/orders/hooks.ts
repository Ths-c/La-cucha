import { useMutation } from '@tanstack/react-query'
import { orderApi } from '@/services/api'
import type { OrderItemInput } from '@/types/domain'

export function useOrderPreview() {
  return useMutation({
    mutationFn: ({ supplierId, items, note }: { supplierId: number; items: OrderItemInput[]; note?: string }) =>
      orderApi.preview(supplierId, items, note),
  })
}