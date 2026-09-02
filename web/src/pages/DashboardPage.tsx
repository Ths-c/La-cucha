import { Link } from 'react-router-dom'
import { useDashboard } from '@/features/dashboard/hooks'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StockBadge } from '@/components/ui/StockBadge'
import { ErrorState, LoadingState } from '@/components/ui/states'

export function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboard()

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Resumen general del negocio" />

      {isLoading && <LoadingState message="Cargando resumen..." />}
      {isError && <ErrorState message="No se pudo cargar el dashboard." onRetry={() => refetch()} />}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Productos activos" value={data.activeProducts} />
            <StatCard label="Stock bajo" value={data.lowStockCount} tone="red" />
            <StatCard label="Movimientos del mes" value={data.movementsThisMonth} />
            <StatCard label="Producto más vendido" value={data.topPurchased[0]?.name ?? '—'} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <LowStockList />
            <TopPurchased />
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  tone = 'green',
}: {
  label: string
  value: number | string
  tone?: 'green' | 'red'
}) {
  return (
    <Card>
      <CardBody>
        <p className="text-sm text-slate-500">{label}</p>
        {typeof value === 'number' ? (
          <p className={`mt-1 text-3xl font-bold ${tone === 'red' ? 'text-red-600' : 'text-slate-900'}`}>
            {value}
          </p>
        ) : (
          <p className="mt-1 text-lg font-semibold leading-snug text-slate-900">{value}</p>
        )}
      </CardBody>
    </Card>
  )
}

function LowStockList() {
  const { data } = useDashboard()
  const items = data?.lowStockProducts ?? []

  return (
    <Card>
      <CardHeader
        title="Productos con stock bajo"
        subtitle="Necesitan reposición"
        action={
          <Link to="/products?lowStock=1" className="text-xs font-medium text-emerald-700 hover:underline">
            Ver todos
          </Link>
        }
      />
      <CardBody>
        {items.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">No hay productos con stock bajo.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/products/${p.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 hover:bg-red-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                    {p.supplier && <p className="text-xs text-slate-500">{p.supplier.name}</p>}
                  </div>
                  <StockBadge stock={p.stock} stockMin={p.stockMin} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}

function TopPurchased() {
  const { data } = useDashboard()
  const items = data?.topPurchased ?? []

  return (
    <Card>
      <CardHeader title="Productos más comprados" subtitle="Por cantidad de entradas (compra)" />
      <CardBody>
        {items.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">Aún no hay datos de compras.</p>
        ) : (
          <ol className="divide-y divide-slate-100">
            {items.map((p, idx) => (
              <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    {idx + 1}
                  </span>
                  <Link
                    to={`/products/${p.id}`}
                    className="truncate text-sm font-medium text-slate-800 hover:text-emerald-700"
                  >
                    {p.name}
                  </Link>
                </div>
                <span className="shrink-0 text-sm font-semibold text-slate-700">{p.totalQuantity} u.</span>
              </li>
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  )
}