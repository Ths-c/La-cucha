import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useProducts, useDeactivateProduct } from '@/features/products/hooks'
import { useCategories } from '@/features/categories/hooks'
import { StockModal, type StockDirection } from '@/features/stock/StockModal'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { StockBadge } from '@/components/ui/StockBadge'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { ProductImage } from '@/components/ui/ProductImage'
import { PlusIcon } from '@/components/icons'
import { STATUS_LABELS } from '@/utils'
import type { Product } from '@/types/domain'

export function ProductsPage() {
  const [searchParams] = useSearchParams()

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [lowStock, setLowStock] = useState(searchParams.get('lowStock') === '1')
  const [page, setPage] = useState(1)

  const [stockTarget, setStockTarget] = useState<{ product: Product; direction: StockDirection } | null>(null)

  const deactivate = useDeactivateProduct()
  const toast = useToast()
  const { confirm, ConfirmationDialog } = useConfirm()
  const navigate = useNavigate()

  const { data: categories } = useCategories()

  const appliedParams = useMemo(
    () => ({
      page,
      limit: 20,
      search: search.trim() || undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      status: status as 'ACTIVE' | 'INACTIVE' | undefined,
      lowStock: lowStock ? true : undefined,
    }),
    [page, search, categoryId, status, lowStock],
  )

  const productsQuery = useProducts(appliedParams)

  const onDeactivate = async (p: Product) => {
    const ok = await confirm({
      title: 'Desactivar producto',
      description: `"${p.name}" pasará a la papelera. No se elimina nada.`,
      confirmLabel: 'Desactivar',
    })
    if (!ok) return
    try {
      await deactivate.mutateAsync(p.id)
      toast.success('Producto desactivado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo desactivar el producto.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Productos"
        subtitle="Catálogo de la tienda"
        action={
          <Button onClick={() => navigate('/products/new')}>
            <PlusIcon className="size-4" />
            <span className="hidden sm:inline">Nuevo</span>
          </Button>
        }
      />

      {/* Filtros */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          id="q"
          label="Buscar"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <Select
          id="cat"
          label="Categoría"
          placeholder="Todas"
          options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value)
            setPage(1)
          }}
        />
        <Select
          id="st"
          label="Estado"
          options={[
            { value: 'ACTIVE', label: 'Activos' },
            { value: 'INACTIVE', label: 'Inactivos' },
          ]}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
        />
        <label className="flex items-end gap-2 pb-1">
          <input
            type="checkbox"
            checked={lowStock}
            onChange={(e) => {
              setLowStock(e.target.checked)
              setPage(1)
            }}
            className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-sm text-slate-700">Solo stock bajo</span>
        </label>
      </div>

      {productsQuery.isError && <ErrorState onRetry={() => productsQuery.refetch()} />}

      {productsQuery.isLoading && <LoadingState message="Cargando productos..." />}

      {!productsQuery.isLoading && !productsQuery.isError && productsQuery.data && (
        productsQuery.data.items.length > 0 ? (
          <>
            {/* Tabla desktop */}
            <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Producto</th>
                    <th className="px-4 py-2.5 font-medium">Categoría</th>
                    <th className="px-4 py-2.5 font-medium">Proveedor</th>
                    <th className="px-4 py-2.5 font-medium">Stock</th>
                    <th className="px-4 py-2.5 font-medium">Estado</th>
                    <th className="px-4 py-2.5 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productsQuery.data.items.map((p) => (
                    <tr key={p.id} className={p.stockMin > 0 && p.stock < p.stockMin ? 'bg-red-50/50' : ''}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <ProductImage src={p.imageUrl} className="size-10 rounded-md" />
                          <Link to={`/products/${p.id}`} className="font-medium text-slate-900 hover:text-emerald-700">
                            {p.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{p.category.name}</td>
                      <td className="px-4 py-2.5 text-slate-600">{p.supplier?.name ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        <StockBadge stock={p.stock} stockMin={p.stockMin} />
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge tone={p.status === 'ACTIVE' ? 'green' : 'slate'}>{STATUS_LABELS[p.status]}</Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <RowActions
                          product={p}
                          onStockIn={() => setStockTarget({ product: p, direction: 'in' })}
                          onStockOut={() => setStockTarget({ product: p, direction: 'out' })}
                          onDeactivate={() => onDeactivate(p)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                page={productsQuery.data.page}
                totalPages={productsQuery.data.totalPages}
                total={productsQuery.data.total}
                onPageChange={setPage}
              />
            </div>

            {/* Cards mobile */}
            <div className="space-y-3 md:hidden">
              {productsQuery.data.items.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-lg border bg-white p-3 shadow-sm ${
                    p.stockMin > 0 && p.stock < p.stockMin ? 'border-red-200' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <ProductImage src={p.imageUrl} className="size-12 rounded-md" />
                    <div className="min-w-0 flex-1">
                      <Link to={`/products/${p.id}`} className="font-medium text-slate-900">
                        {p.name}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {p.category.name} · {p.supplier?.name ?? 'Sin proveedor'}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <StockBadge stock={p.stock} stockMin={p.stockMin} />
                        <Badge tone={p.status === 'ACTIVE' ? 'green' : 'slate'}>{STATUS_LABELS[p.status]}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setStockTarget({ product: p, direction: 'in' })}>
                      + Stock
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setStockTarget({ product: p, direction: 'out' })}>
                      − Stock
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeactivate(p)}
                      disabled={p.status === 'INACTIVE'}
                    >
                      Desactivar
                    </Button>
                  </div>
                </div>
              ))}
              <Pagination
                page={productsQuery.data.page}
                totalPages={productsQuery.data.totalPages}
                total={productsQuery.data.total}
                onPageChange={setPage}
              />
            </div>
          </>
        ) : (
          <EmptyState
            icon="🗂️"
            title="No hay productos registrados."
            description="Creá un producto para comenzar."
          />
        )
      )}

      <StockModal
        open={!!stockTarget}
        onClose={() => setStockTarget(null)}
        productId={stockTarget?.product.id ?? 0}
        productName={stockTarget?.product.name ?? ''}
        currentStock={stockTarget?.product.stock ?? 0}
        direction={stockTarget?.direction ?? 'in'}
      />
      <ConfirmationDialog />
    </div>
  )
}

function RowActions({
  product,
  onStockIn,
  onStockOut,
  onDeactivate,
}: {
  product: Product
  onStockIn: () => void
  onStockOut: () => void
  onDeactivate: () => void
}) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button size="sm" variant="outline" onClick={onStockIn} title="Sumar stock">
        + Stock
      </Button>
      <Button size="sm" variant="outline" onClick={onStockOut} title="Restar stock">
        − Stock
      </Button>
      {product.status === 'ACTIVE' ? (
        <Button size="sm" variant="ghost" onClick={onDeactivate}>
          Desactivar
        </Button>
      ) : (
        <Link to={`/products/${product.id}/edit`}>
          <Button size="sm" variant="ghost">
            Editar
          </Button>
        </Link>
      )}
    </div>
  )
}