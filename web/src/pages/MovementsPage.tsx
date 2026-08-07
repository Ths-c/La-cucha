import { useMemo, useState } from 'react'
import { useMovements } from '@/features/movements/hooks'
import { useProducts } from '@/features/products/hooks'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states'
import { MovementItem } from '@/components/ui/MovementItem'
import { MOVEMENT_LABELS } from '@/utils'
import type { MovementType } from '@/types/domain'

const MOVEMENT_TYPES: MovementType[] = [
  'BUY',
  'SALE',
  'BREAKAGE',
  'EXPIRY',
  'DONATION',
  'INTERNAL_CONSUMPTION',
  'MANUAL_ADJUST',
]

export function MovementsPage() {
  const [type, setType] = useState('')
  const [productId, setProductId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  const { data: products } = useProducts({ status: 'ACTIVE', limit: 200 })

  const params = useMemo(
    () => ({
      page,
      limit: 20,
      type: (type || undefined) as MovementType | undefined,
      productId: productId ? Number(productId) : undefined,
      from: from || undefined,
      to: to || undefined,
    }),
    [page, type, productId, from, to],
  )

  const query = useMovements(params)

  const resetPage = () => setPage(1)

  return (
    <div>
      <PageHeader title="Movimientos" subtitle="Entradas y salidas de stock" />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Select
          id="mv-type"
          label="Tipo"
          placeholder="Todos"
          value={type}
          onChange={(e) => { setType(e.target.value); resetPage() }}
          options={MOVEMENT_TYPES.map((t) => ({ value: t, label: MOVEMENT_LABELS[t] ?? t }))}
        />
        <Select
          id="mv-product"
          label="Producto"
          placeholder="Todos"
          value={productId}
          onChange={(e) => { setProductId(e.target.value); resetPage() }}
          options={(products?.items ?? []).map((p) => ({ value: p.id, label: p.name }))}
        />
        <Input id="mv-from" label="Desde" type="date" value={from} onChange={(e) => { setFrom(e.target.value); resetPage() }} />
        <Input id="mv-to" label="Hasta" type="date" value={to} onChange={(e) => { setTo(e.target.value); resetPage() }} />
      </div>

      {query.isError && <ErrorState onRetry={() => query.refetch()} />}
      {query.isLoading && <LoadingState message="Cargando movimientos..." />}

      {!query.isLoading && !query.isError && query.data && (
        query.data.items.length > 0 ? (
          <Card>
            <div className="divide-y divide-slate-100 px-4">
              {query.data.items.map((m) => (
                <div key={m.id} className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 py-2.5 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">{m.product.name}</p>
                    <MovementItem m={m} />
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={query.data.page} totalPages={query.data.totalPages} total={query.data.total} onPageChange={setPage} />
          </Card>
        ) : (
          <EmptyState icon="🔀" title="Sin movimientos registrados." description="Ajustá los filtros o registrá entradas/salidas de stock." />
        )
      )}
    </div>
  )
}