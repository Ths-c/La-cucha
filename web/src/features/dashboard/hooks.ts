import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/services/api'
import { qk } from '@/lib/query-keys'

export function useDashboard() {
  return useQuery({
    queryKey: qk.dashboard,
    queryFn: dashboardApi.summary,
  })
}