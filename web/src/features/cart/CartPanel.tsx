import { useCart } from '@/features/cart/CartContext'
import { useOrderPreview } from '@/features/orders/hooks'
import { useToast } from '@/components/ui/Toast'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/ui/states'
import { WhatsAppIcon, CloseIcon } from '@/components/icons'

interface CartPanelProps {
  supplierId: number
}

export function CartPanel({ supplierId }: CartPanelProps) {
  const cart = useCart()
  const toast = useToast()
  const preview = useOrderPreview()

  const handleSend = async () => {
    if (cart.items.length === 0) return
    try {
      const result = await preview.mutateAsync({
        supplierId,
        items: cart.items.map((i) => ({ supplierProductId: i.supplierProductId, quantity: i.quantity })),
        note: cart.note || undefined,
      })
      window.open(result.whatsappUrl, '_blank')
      toast.info('Pedido listo para enviar por WhatsApp.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo generar el pedido.')
    }
  }

  return (
    <Card>
      <CardHeader
        title="Pedido"
        subtitle="Productos del proveedor en el carrito"
        action={
          cart.count > 0 ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
              {cart.count} u.
            </span>
          ) : null
        }
      />
      <CardBody>
        {cart.items.length === 0 ? (
          <EmptyState icon="🛒" title="El pedido está vacío." description="Agregá productos del listado para armar el pedido." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {cart.items.map((item) => (
              <li key={item.supplierProductId} className="flex items-center gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => cart.setQuantity(item.supplierProductId, item.quantity - 1)}
                    className="flex size-7 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
                    aria-label="Disminuir cantidad"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => cart.setQuantity(item.supplierProductId, item.quantity + 1)}
                    className="flex size-7 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => cart.remove(item.supplierProductId)}
                  className="flex size-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-red-600"
                  aria-label="Quitar del pedido"
                >
                  <CloseIcon className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {cart.items.length > 0 && (
          <div className="mt-3 space-y-3">
            <Textarea
              id="order-note"
              label="Observación general"
              placeholder="Opcional"
              value={cart.note}
              onChange={(e) => cart.setNote(e.target.value)}
            />
            <Button
              className="w-full"
              variant="primary"
              size="lg"
              onClick={handleSend}
              loading={preview.isPending}
              disabled={preview.isPending}
            >
              <WhatsAppIcon className="size-5" />
              Enviar por WhatsApp
            </Button>
          </div>
        )}
        {cart.items.length > 0 && (
          <button
            onClick={cart.clear}
            className="mt-2 text-xs text-slate-500 hover:text-red-600 underline"
          >
            Vaciar pedido
          </button>
        )}
      </CardBody>
    </Card>
  )
}