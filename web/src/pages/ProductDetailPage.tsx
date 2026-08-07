import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  useDeactivateProduct,
  useProduct,
  useProductMovements,
  useRestoreProduct,
} from '@/features/products/hooks'
import { StockModal, type StockDirection } from '@/features/stock/StockModal'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { StockBadge } from '@/components/ui/StockBadge'
import { Pagination } from '@/components/ui/Pagination'
import { ErrorState, LoadingState, EmptyState } from '@/components/ui/states'
import { ProductImage } from '@/components/ui/ProductImage'
import { MovementItem } from '@/components/ui/MovementItem'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { BackIcon, EditIcon } from '@/components/icons'
import { STATUS_LABELS } from '@/utils'

export function ProductDetailPage() {
  const { id } = useParams()
  const productId = Number(id)
  const navigate = useNavigate()
  const toast = useToast()
  const { confirm, ConfirmationDialog } = useConfirm()

  const [page, setPage] = useState(1)
  const [stockTarget, setStockTarget] = useState<{ direction: StockDirection } | null>(null)

  const { data: product, isLoading, isError, refetch } = useProduct(productId)
  const movementsQuery = useProductMovements(productId, page)
  const deactivate = useDeactivateProduct()
  const restore = useRestoreProduct()

  const onToggleStatus = async () => {
    if (!product) return
    if (product.status === 'ACTIVE') {
      const ok = await confirm({
        title: 'Desactivar producto',
        description: `"${product.name}" pasará a la papelera.`,
        confirmLabel: 'Desactivar',
      })
      if (!ok) return
      try {
        await deactivate.mutateAsync(product.id)
        toast.success('Producto desactivado')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'No se pudo desactivar.')
      }
    } else {
      try {
        await restore.mutateAsync(product.id)
        toast.success('Producto restaurado')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'No se pudo restaurar.')
      }
    }
  }

  if (isLoading) return <LoadingState message="Cargando producto..." />
  if (isError) return <ErrorState message="No se pudo cargar el producto." onRetry={() => refetch()} />
  if (!product) return <ErrorState message="Producto no encontrado." />

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/products')}>
              <BackIcon className="size-4" />
              Volver
            </Button>
            <Button variant="outline" size="sm" onClick={() => setStockTarget({ direction: 'out' })}>
              − Stock
            </Button>
            <Button variant="outline" size="sm" onClick={() => setStockTarget({ direction: 'in' })}>
              + Stock
            </Button>
            <Link to={`/products/${productId}/edit`}>
              <Button variant="outline" size="sm">
                <EditIcon className="size-4" />
                Editar
              </Button>
            </Link>
            <Button
              variant={product.status === 'ACTIVE' ? 'danger' : 'primary'}
              size="sm"
              onClick={onToggleStatus}
              loading={deactivate.isPending || restore.isPending}
            >
              {product.status === 'ACTIVE' ? 'Desactivar' : 'Restaurar'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Info */}
        <Card className="lg:col-span-1">
          <CardBody className="space-y-4">
            <ProductImage src={product.imageUrl} className="h-40 w-full rounded-md" />
            <div className="space-y-2 text-sm">
              <InfoRow label="Categoría" value={product.category.name} />
              <InfoRow label="Proveedor" value={product.supplier?.name ?? '—'} />
              <InfoRow label="Stock mínimo" value={String(product.stockMin)} />
              <InfoRow
                label="Estado"
                value={
                  <Badge tone={product.status === 'ACTIVE' ? 'green' : 'slate'}>
                    {STATUS_LABELS[product.status]}
                  </Badge>
                }
              />
              <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                <span className="text-slate-500">Stock actual</span>
                <StockBadge stock={product.stock} stockMin={product.stockMin} />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Historial */}
        <Card className="lg:col-span-2">
          <CardHeader title="Historial de movimientos" subtitle="Entradas y salidas de stock" />
          <CardBody className="p-2">
            {movementsQuery.isLoading && <LoadingState message="Cargando historial..." />}
            {movementsQuery.isError && <ErrorState message="No se pudo cargar el historial." />}
            {movementsQuery.data && movementsQuery.data.items.length === 0 && (
              <EmptyState icon="🧾" title="Sin movimientos." description="El producto aún no registra entradas ni salidas." />
            )}
            {movementsQuery.data && movementsQuery.data.items.length > 0 && (
              <>
                <ul className="divide-y divide-slate-100 px-2">
                  {movementsQuery.data.items.map((m) => (
                    <MovementItem key={m.id} m={m} />
                  ))}
                </ul>
                <Pagination
                  page={movementsQuery.data.page}
                  totalPages={movementsQuery.data.totalPages}
                  total={movementsQuery.data.total}
                  onPageChange={setPage}
                />
              </>
            )}
          </CardBody>
        </Card>
      </div>

      <StockModal
        open={!!stockTarget}
        onClose={() => setStockTarget(null)}
        productId={product.id}
        productName={product.name}
        currentStock={product.stock}
        direction={stockTarget?.direction ?? 'in'}
      />
      <ConfirmationDialog />
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  )
}