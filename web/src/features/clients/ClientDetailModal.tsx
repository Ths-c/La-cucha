import { useState } from 'react'
import { useClient, useClientPurchases } from '@/features/clients/hooks'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states'
import { formatDate, STATUS_LABELS } from '@/utils'

interface ClientDetailModalProps {
  open: boolean
  onClose: () => void
  clientId: number
}

export function ClientDetailModal({ open, onClose, clientId }: ClientDetailModalProps) {
  const [page, setPage] = useState(1)
  const { data: client, isLoading, isError, refetch } = useClient(clientId)
  const purchases = useClientPurchases(clientId, { page, limit: 10 })

  return (
    <Modal open={open} onClose={onClose} title={client?.name ?? 'Cliente'} size="lg">
      {isLoading && <LoadingState message="Cargando cliente..." />}
      {isError && <ErrorState message="No se pudo cargar el cliente." onRetry={() => refetch()} />}

      {client && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-lg font-semibold text-slate-900">{client.name}</p>
              {client.contact && (
                <p className="mt-0.5 text-sm text-slate-600">Contacto: {client.contact}</p>
              )}
              {client.notes && <p className="mt-1 text-sm text-slate-500">{client.notes}</p>}
            </div>
            <Badge tone={client.status === 'ACTIVE' ? 'green' : 'slate'}>
              {STATUS_LABELS[client.status]}
            </Badge>
          </div>

          <div>
            <h4 className="mb-1 text-sm font-semibold text-slate-700">Historial de compra</h4>
            {purchases.isError && <ErrorState onRetry={() => purchases.refetch()} />}
            {purchases.isLoading && <LoadingState message="Cargando historial..." />}

            {!purchases.isLoading && !purchases.isError && purchases.data && (
              purchases.data.items.length > 0 ? (
                <>
                  <ul className="divide-y divide-slate-100">
                    {purchases.data.items.map((m) => (
                      <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {m.product?.name ?? 'Producto'}
                          </p>
                          {m.note && <p className="truncate text-xs text-slate-500">{m.note}</p>}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-red-600">−{m.quantity} u.</p>
                          <p className="text-xs text-slate-400">{formatDate(m.createdAt)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <Pagination
                    page={purchases.data.page}
                    totalPages={purchases.data.totalPages}
                    total={purchases.data.total}
                    onPageChange={setPage}
                  />
                </>
              ) : (
                <EmptyState icon="🛒" title="Sin compras registradas." description="Las ventas asociadas a este cliente aparecerán aquí." />
              )
            )}
          </div>

          <div className="flex justify-end pt-1">
            <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
