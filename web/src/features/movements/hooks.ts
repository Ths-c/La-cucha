import { useQuery } from '@tanstack/react-query'
import { movementApi } from '@/services/api'
import type { MovementListParams } from '@/types/domain'
import { qk } from '@/lib/query-keys'

export function useMovements(params: MovementListParams) {
  return useQuery({
    queryKey: qk.movements(params),
    queryFn: () => movementApi.list(params),
    placeholderData: (prev) => prev,
  })
}