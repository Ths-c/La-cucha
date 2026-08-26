import { useMemo, useState } from 'react'
import { useDeactivateClient, useRestoreClient, useClients } from '@/features/clients/hooks'
import { ClientFormModal } from '@/features/clients/ClientFormModal'
import { ClientDetailModal } from '@/features/clients/ClientDetailModal'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Pagination } from '@/components/ui/Pagination'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { PlusIcon } from '@/components/icons'
import { STATUS_LABELS } from '@/utils'
import type { Client } from '@/types/domain'

export function ClientsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [detailId, setDetailId] = useState<number | null>(null)

  const toast = useToast()
  const { confirm, ConfirmationDialog } = useConfirm()
  const deactivate = useDeactivateClient()
  const restore = useRestoreClient()

  const params = useMemo(
    () => ({ page, limit: 20, search: search.trim() || undefined, status: status as 'ACTIVE' | 'INACTIVE' | undefined }),
    [page, search, status],
  )
  const query = useClients(params)

  const onDeactivate = async (c: Client) => {
    const ok = await confirm({
      title: 'Desactivar cliente',
      description: `"${c.name}" pasará a la papelera. Su historial de compras se conserva.`,
      confirmLabel: 'Desactivar',
    })
    if (!ok) return
    try {
      await deactivate.mutateAsync(c.id)
      toast.success('Cliente desactivado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo desactivar.')
    }
  }

  const onRestore = async (c: Client) => {
    try {
      await restore.mutateAsync(c.id)
      toast.success('Cliente restaurado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo restaurar.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Quiénes compran en tu pet shop"
        action={
          <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
            <PlusIcon className="size-4" />
            <span className="hidden sm:inline">Nuevo</span>
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input
          id="q"
          label="Buscar"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
        <Select
          id="st"
          label="Estado"
          options={[
            { value: 'ACTIVE', label: 'Activos' },
            { value: 'INACTIVE', label: 'Inactivos' },
          ]}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
        />
      </div>

      {query.isError && <ErrorState onRetry={() => query.refetch()} />}
      {query.isLoading && <LoadingState message="Cargando clientes..." />}

      {!query.isLoading && !query.isError && query.data && (
        query.data.items.length > 0 ? (
          <div className="space-y-3">
            {query.data.items.map((c) => (
              <Card key={c.id} className="cursor-pointer p-4" onClick={() => setDetailId(c.id)}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-800">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{c.name}</p>
                      <p className="truncate text-sm text-slate-500">{c.contact || 'Sin contacto'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <Badge tone={c.status === 'ACTIVE' ? 'green' : 'slate'}>{STATUS_LABELS[c.status]}</Badge>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setEditing(c); setFormOpen(true) }}
                      >
                        Editar
                      </Button>
                      {c.status === 'ACTIVE' ? (
                        <Button size="sm" variant="ghost" onClick={() => onDeactivate(c)}>Desactivar</Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => onRestore(c)}>Restaurar</Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            <Pagination page={query.data.page} totalPages={query.data.totalPages} total={query.data.total} onPageChange={setPage} />
          </div>
        ) : (
          <EmptyState icon="🐾" title="No hay clientes registrados." description="Agregá un cliente para comenzar." />
        )
      )}

      <ClientFormModal open={formOpen} onClose={() => setFormOpen(false)} client={editing} />
      <ClientDetailModal open={detailId !== null} onClose={() => setDetailId(null)} clientId={detailId ?? 0} />
      <ConfirmationDialog />
    </div>
  )
}
