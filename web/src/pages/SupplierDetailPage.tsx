import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSupplier, useSupplierProducts, useDeactivateSupplierProduct } from '@/features/suppliers/hooks'
import { SupplierProductModal } from '@/features/suppliers/SupplierProductModal'
import { CartProvider, useCart } from '@/features/cart/CartContext'
import { CartPanel } from '@/features/cart/CartPanel'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { BackIcon, PlusIcon, EditIcon, CloseIcon, WhatsAppIcon } from '@/components/icons'
import type { SupplierProduct } from '@/types/domain'

export function SupplierDetailPage() {
  const { id } = useParams()
  const supplierId = Number(id)
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<{ open: boolean; item: SupplierProduct | null }>({ open: false, item: null })

  const { data: supplier, isLoading, isError, refetch } = useSupplier(supplierId)
  const products = useSupplierProducts(supplierId, { page, limit: 20, search: search.trim() || undefined, status: 'ACTIVE' })
  const deactivate = useDeactivateSupplierProduct()
  const toast = useToast()
  const { confirm, ConfirmationDialog } = useConfirm()

  const onDelete = async (item: SupplierProduct) => {
    const ok = await confirm({
      title: 'Quitar del listado',
      description: `"${item.name}" dejará de ofrecerse a este proveedor. Podés volver a agregarlo después.`,
      confirmLabel: 'Quitar',
    })
    if (!ok) return
    try {
      await deactivate.mutateAsync({ supplierId, itemId: item.id })
      toast.success('Producto quitado del listado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo quitar.')
    }
  }

  return (
    <CartProvider>
      <PageHeader
        title={supplier?.name ?? 'Proveedor'}
        subtitle="Listado de productos y pedido por WhatsApp"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/suppliers')}>
              <BackIcon className="size-4" />
              Volver
            </Button>
            <Link to={`/suppliers/${supplierId}/edit`}>
              <Button variant="outline" size="sm">
                <EditIcon className="size-4" />
                Editar
              </Button>
            </Link>
          </div>
        }
      />

      {isLoading && <LoadingState message="Cargando proveedor..." />}
      {isError && <ErrorState message="No se pudo cargar el proveedor." onRetry={() => refetch()} />}

      {supplier && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardBody>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{supplier.name}</p>
                    <p className="flex items-center gap-1.5 text-sm text-slate-500">
                      <WhatsAppIcon className="size-4" />
                      {supplier.whatsappNumber}
                    </p>
                    {supplier.notes && <p className="mt-1 text-sm text-slate-600">{supplier.notes}</p>}
                  </div>
                  <Badge tone={supplier.status === 'ACTIVE' ? 'green' : 'slate'}>
                    {supplier.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Listado de productos"
                action={
                  <Button size="sm" onClick={() => setModal({ open: true, item: null })}>
                    <PlusIcon className="size-4" />
                    <span className="hidden sm:inline">Agregar</span>
                  </Button>
                }
              />
              <CardBody className="p-3">
                <div className="mb-3">
                  <Input id="sp-q" placeholder="Buscar producto..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
                </div>

                {products.isError && <ErrorState onRetry={() => products.refetch()} />}
                {products.isLoading && <LoadingState message="Cargando listado..." />}

                {!products.isLoading && !products.isError && products.data && (
                  products.data.items.length > 0 ? (
                    <>
                      <ul className="divide-y divide-slate-100">
                        {products.data.items.map((item) => (
                          <SupplierProductRow key={item.id} item={item} onEdit={() => setModal({ open: true, item })} onDelete={() => onDelete(item)} />
                        ))}
                      </ul>
                      <Pagination page={products.data.page} totalPages={products.data.totalPages} total={products.data.total} onPageChange={setPage} />
                    </>
                  ) : (
                    <EmptyState icon="📦" title="Sin productos en el listado." description='Usá "Agregar" para incluirlos en los pedidos.' />
                  )
                )}
              </CardBody>
            </Card>
          </div>

          <div className="lg:sticky lg:top-6 lg:self-start">
            <CartPanel supplierId={supplierId} />
          </div>
        </div>
      )}

      <SupplierProductModal open={modal.open} onClose={() => setModal({ open: false, item: null })} supplierId={supplierId} item={modal.item} />
      <ConfirmationDialog />
    </CartProvider>
  )
}

function SupplierProductRow({ item, onEdit, onDelete }: { item: SupplierProduct; onEdit: () => void; onDelete: () => void }) {
  const cart = useCart()
  const qty = cart.items.find((i) => i.supplierProductId === item.id)?.quantity ?? 0

  return (
    <li className="flex items-center justify-between gap-2 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
        <p className="text-xs text-slate-500">
          {item.category?.name ?? 'Sin categoría'}
          {item.notes ? ` · ${item.notes}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge tone={qty > 0 ? 'green' : 'slate'}>{qty > 0 ? `En pedido · ${qty} u.` : 'Disponible'}</Badge>
        {qty > 0 ? (
          <QuantityStepper id={item.id} qty={qty} />
        ) : (
          <Button size="sm" onClick={() => cart.add({ id: item.id, name: item.name })}>
            <PlusIcon className="size-4" />
            <span className="hidden sm:inline">Agregar</span>
          </Button>
        )}
        <Button size="sm" variant="ghost" title="Editar" onClick={onEdit}>
          <EditIcon className="size-4" />
        </Button>
        <Button size="sm" variant="ghost" title="Quitar del listado" onClick={onDelete}>
          <CloseIcon className="size-4" />
        </Button>
      </div>
    </li>
  )
}

function QuantityStepper({ id, qty }: { id: number; qty: number }) {
  const cart = useCart()
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => cart.setQuantity(id, qty - 1)}
        className="flex size-7 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
        aria-label="Disminuir cantidad"
      >
        −
      </button>
      <span className="w-7 text-center text-sm font-semibold">{qty}</span>
      <button
        onClick={() => cart.setQuantity(id, qty + 1)}
        className="flex size-7 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
        aria-label="Aumentar cantidad"
      >
        +
      </button>
    </div>
  )
}