import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { productApi, supplierApi } from '@/services/api'
import { useRestoreProduct } from '@/features/products/hooks'
import { useRestoreSupplier } from '@/features/suppliers/hooks'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states'
import { StockBadge } from '@/components/ui/StockBadge'
import { ProductImage } from '@/components/ui/ProductImage'
import { useToast } from '@/components/ui/Toast'
import { STATUS_LABELS, formatDate } from '@/utils'
import type { ProductListParams, SupplierListParams } from '@/types/domain'

type Tab = 'products' | 'suppliers'

export function TrashPage() {
  const [tab, setTab] = useState<Tab>('products')
  const [page, setPage] = useState(1)
  const toast = useToast()

  const restoreProduct = useRestoreProduct()
  const restoreSupplier = useRestoreSupplier()

  const productsParams: ProductListParams = { page, limit: 20, status: 'INACTIVE' }
  const suppliersParams: SupplierListParams = { page, limit: 20, status: 'INACTIVE' }

  const productsQuery = useQuery({
    queryKey: ['trash', 'products', productsParams],
    queryFn: () => productApi.trash(productsParams),
    enabled: tab === 'products',
    placeholderData: (prev) => prev,
  })
  const suppliersQuery = useQuery({
    queryKey: ['trash', 'suppliers', suppliersParams],
    queryFn: () => supplierApi.trash(suppliersParams),
    enabled: tab === 'suppliers',
    placeholderData: (prev) => prev,
  })

  const onRestoreProduct = async (id: number) => {
    try {
      await restoreProduct.mutateAsync(id)
      toast.success('Producto restaurado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo restaurar.')
    }
  }

  const onRestoreSupplier = async (id: number) => {
    try {
      await restoreSupplier.mutateAsync(id)
      toast.success('Proveedor restaurado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo restaurar.')
    }
  }

  const activeQuery = tab === 'products' ? productsQuery : suppliersQuery

  return (
    <div>
      <PageHeader title="Papelera" subtitle="Elementos desactivados; podés restaurarlos" />

      <div className="mb-4 flex gap-2">
        {(['products', 'suppliers'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1) }}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === t ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t === 'products' ? 'Productos' : 'Proveedores'}
          </button>
        ))}
      </div>

      {activeQuery.isError && <ErrorState onRetry={() => activeQuery.refetch()} />}
      {activeQuery.isLoading && <LoadingState message="Cargando papelera..." />}

      {!activeQuery.isLoading && !activeQuery.isError && activeQuery.data && (
        tab === 'products' ? (
          productsQuery.data && productsQuery.data.items.length > 0 ? (
            <div className="space-y-3">
              {productsQuery.data.items.map((p) => (
                <ProductRow
                  key={p.id}
                  name={p.name}
                  imageUrl={p.imageUrl}
                  stock={p.stock}
                  stockMin={p.stockMin}
                  category={p.category.name}
                  createdAt={p.createdAt}
                  onRestore={() => onRestoreProduct(p.id)}
                  pending={restoreProduct.isPending}
                />
              ))}
              <Pagination page={productsQuery.data.page} totalPages={productsQuery.data.totalPages} total={productsQuery.data.total} onPageChange={setPage} />
            </div>
          ) : (
            <EmptyState icon="🗑️" title="No hay productos en la papelera." />
          )
        ) : suppliersQuery.data && suppliersQuery.data.items.length > 0 ? (
          <div className="space-y-3">
            {suppliersQuery.data.items.map((s) => (
              <SupplierRow
                key={s.id}
                name={s.name}
                whatsappNumber={s.whatsappNumber}
                createdAt={s.createdAt}
                onRestore={() => onRestoreSupplier(s.id)}
                pending={restoreSupplier.isPending}
              />
            ))}
            <Pagination page={suppliersQuery.data.page} totalPages={suppliersQuery.data.totalPages} total={suppliersQuery.data.total} onPageChange={setPage} />
          </div>
        ) : (
          <EmptyState icon="🗑️" title="No hay proveedores en papelera." />
        )
      )}
    </div>
  )
}

function ProductRow({
  name,
  imageUrl,
  stock,
  stockMin,
  category,
  createdAt,
  onRestore,
  pending,
}: {
  name: string
  imageUrl: string | null
  stock: number
  stockMin: number
  category: string
  createdAt: string
  onRestore: () => void
  pending: boolean
}) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ProductImage src={imageUrl} className="size-10 rounded-md" />
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-800">{name}</p>
            <p className="text-xs text-slate-500">
              {category} · {formatDate(createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone="slate">{STATUS_LABELS.INACTIVE}</Badge>
          <StockBadge stock={stock} stockMin={stockMin} />
          <Button size="sm" variant="outline" onClick={onRestore} loading={pending}>
            Restaurar
          </Button>
        </div>
      </div>
    </Card>
  )
}

function SupplierRow({
  name,
  whatsappNumber,
  createdAt,
  onRestore,
  pending,
}: {
  name: string
  whatsappNumber: string
  createdAt: string
  onRestore: () => void
  pending: boolean
}) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-800">{name}</p>
          <p className="text-xs text-slate-500">{whatsappNumber} · {formatDate(createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone="slate">{STATUS_LABELS.INACTIVE}</Badge>
          <Button size="sm" variant="outline" onClick={onRestore} loading={pending}>
            Restaurar
          </Button>
        </div>
      </div>
    </Card>
  )
}