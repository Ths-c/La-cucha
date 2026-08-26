import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clientApi } from '@/services/api'
import type { CreateClientInput, UpdateClientInput } from '@/services/api'
import type { ClientListParams } from '@/types/domain'
import { qk } from '@/lib/query-keys'

export function useClients(params: ClientListParams) {
  return useQuery({
    queryKey: qk.clients(params),
    queryFn: () => clientApi.list(params),
    placeholderData: (prev) => prev,
  })
}

export function useClient(id: number) {
  return useQuery({
    queryKey: qk.client(id),
    queryFn: () => clientApi.get(id),
    enabled: id > 0,
  })
}

export function useClientPurchases(id: number, params: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: qk.clientPurchases(id, params),
    queryFn: () => clientApi.purchases(id, params),
    enabled: id > 0,
    placeholderData: (prev) => prev,
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateClientInput) => clientApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.clients() }),
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateClientInput }) =>
      clientApi.update(id, input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: qk.clients() })
      qc.invalidateQueries({ queryKey: qk.client(vars.id) })
    },
  })
}

export function useDeactivateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => clientApi.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.clients() })
      qc.invalidateQueries({ queryKey: qk.trash })
    },
  })
}

export function useRestoreClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => clientApi.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.clients() })
      qc.invalidateQueries({ queryKey: qk.trash })
    },
  })
}
