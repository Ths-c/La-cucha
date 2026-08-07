import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDeactivateSupplier, useRestoreSupplier, useSupplierProducts, useSuppliers } from '@/features/suppliers/hooks'
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
import { PlusIcon, WhatsAppIcon } from '@/components/icons'
import { STATUS_LABELS } from '@/utils'
import type { Supplier } from '@/types/domain'

export function SuppliersPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [page, setPage] = useState(1)
  const navigate = useNavigate()
  const toast = useToast()
  const { confirm, ConfirmationDialog } = useConfirm()

  const deactivate = useDeactivateSupplier()
  const restore = useRestoreSupplier()

  const params = useMemo(
    () => ({ page, limit: 20, search: search.trim() || undefined, status: status as 'ACTIVE' | 'INACTIVE' | undefined }),
    [page, search, status],
  )
  const query = useSuppliers(params)

  const onDeactivate = async (s: Supplier) => {
    const ok = await confirm({
      title: 'Desactivar proveedor',
      description: `"${s.name}" pasará a la papelera. Sus productos y el historial se conservan.`,
      confirmLabel: 'Desactivar',
    })
    if (!ok) return
    try {
      await deactivate.mutateAsync(s.id)
      toast.success('Proveedor desactivado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo desactivar.')
    }
  }

  const onRestore = async (s: Supplier) => {
    try {
      await restore.mutateAsync(s.id)
      toast.success('Proveedor restaurado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo restaurar.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Proveedores"
        subtitle="Quiénes te abastecen"
        action={
          <Button onClick={() => navigate('/suppliers/new')}>
            <PlusIcon className="size-4" />
            <span className="hidden sm:inline">Nuevo</span>
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input id="q" label="Buscar" placeholder="Buscar por nombre..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
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
      {query.isLoading && <LoadingState message="Cargando proveedores..." />}

      {!query.isLoading && !query.isError && query.data && (
        query.data.items.length > 0 ? (
          <div className="space-y-3">
            {query.data.items.map((s) => (
              <Card key={s.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <Link to={`/suppliers/${s.id}`} className="font-medium text-slate-900 hover:text-emerald-700">
                        {s.name}
                      </Link>
                      <p className="flex items-center gap-1 text-sm text-slate-500">
                        <WhatsAppIcon className="size-3.5" />
                        {s.whatsappNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <SupplierProductCount supplierId={s.id} />
                    <Badge tone={s.status === 'ACTIVE' ? 'green' : 'slate'}>{STATUS_LABELS[s.status]}</Badge>
                    <div className="flex gap-1.5">
                      <Link to={`/suppliers/${s.id}`}>
                        <Button size="sm" variant="outline">Ver</Button>
                      </Link>
                      <Link to={`/suppliers/${s.id}/edit`}>
                        <Button size="sm" variant="ghost">Editar</Button>
                      </Link>
                      {s.status === 'ACTIVE' ? (
                        <Button size="sm" variant="ghost" onClick={() => onDeactivate(s)}>Desactivar</Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => onRestore(s)}>Restaurar</Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            <Pagination page={query.data.page} totalPages={query.data.totalPages} total={query.data.total} onPageChange={setPage} />
          </div>
        ) : (
          <EmptyState icon="🤝" title="No hay proveedores registrados." description="Agregá un proveedor para comenzar." />
        )
      )}

      <ConfirmationDialog />
    </div>
  )
}

function SupplierProductCount({ supplierId }: { supplierId: number }) {
  const { data } = useSupplierProducts(supplierId, { page: 1, limit: 1 })
  const count = data?.total ?? 0
  return (
    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
      {count} en su listado
    </span>
  )
}