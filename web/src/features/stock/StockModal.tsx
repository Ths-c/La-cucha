import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ApiError } from '@/lib/api/client'
import { useStockIn, useStockOut } from '@/features/products/hooks'
import { useSuppliers } from '@/features/suppliers/hooks'
import { useClients } from '@/features/clients/hooks'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import {
  stockInFormSchema,
  stockOutFormSchema,
  type StockInFormValues,
  type StockOutFormValues,
} from '@/schemas/form'
import { MOVEMENT_LABELS } from '@/utils'

export type StockDirection = 'in' | 'out'

interface StockModalProps {
  open: boolean
  onClose: () => void
  productId: number
  productName: string
  currentStock: number
  direction: StockDirection
}

const IN_TYPES: Array<'BUY' | 'MANUAL_ADJUST'> = ['BUY', 'MANUAL_ADJUST']
const OUT_TYPES: Array<'SALE' | 'BREAKAGE' | 'EXPIRY' | 'DONATION' | 'INTERNAL_CONSUMPTION' | 'MANUAL_ADJUST'> = [
  'SALE',
  'BREAKAGE',
  'EXPIRY',
  'DONATION',
  'INTERNAL_CONSUMPTION',
  'MANUAL_ADJUST',
]

type StockFormValues = StockInFormValues | StockOutFormValues

export function StockModal({ open, onClose, productId, productName, currentStock, direction }: StockModalProps) {
  const toast = useToast()
  const stockIn = useStockIn()
  const stockOut = useStockOut()
  const isIn = direction === 'in'

  const { data: suppliers } = useSuppliers({ status: 'ACTIVE', limit: 200 })
  const supplierOptions = (suppliers?.items ?? []).map((s) => ({ value: s.id, label: s.name }))

  const { data: clients } = useClients({ status: 'ACTIVE', limit: 200 })
  const clientOptions = (clients?.items ?? []).map((c) => ({ value: c.id, label: c.name }))

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<StockFormValues>({
    resolver: zodResolver(isIn ? stockInFormSchema : stockOutFormSchema) as unknown as Resolver<StockFormValues>,
    defaultValues: {
      type: isIn ? 'BUY' : 'SALE',
      quantity: 1,
      ...(isIn ? { supplierId: undefined as undefined } : {}),
    },
  })

  const outType = watch('type')
  const isSale = !isIn && outType === 'SALE'

  const close = () => {
    reset()
    onClose()
  }

  const mutation = isIn ? stockIn : stockOut
  const processing = mutation.isPending

  const onSubmit = async (values: StockInFormValues | StockOutFormValues) => {
    try {
      if (isIn) {
        const input = values as StockInFormValues
        await stockIn.mutateAsync({
          id: productId,
          input: { type: input.type, quantity: Number(input.quantity), supplierId: input.supplierId ?? null, note: input.note ?? undefined },
        })
        toast.success(`Entrada registrada (${input.quantity} u.)`)
      } else {
        const input = values as StockOutFormValues
        await stockOut.mutateAsync({
          id: productId,
          input: {
            type: input.type,
            quantity: Number(input.quantity),
            clientId: isSale ? input.clientId ?? null : null,
            note: input.note ?? undefined,
          },
        })
        toast.success(`Salida registrada (${input.quantity} u.)`)
      }
      close()
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error('No se pudo registrar el movimiento.')
      }
      // No cerramos el modal: el stock no se actualizó.
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={isIn ? 'Entrada de stock' : 'Salida de stock'}
      description={`${productName} — stock actual: ${currentStock} u.`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          id="type"
          label="Tipo de movimiento"
          options={(isIn ? IN_TYPES : OUT_TYPES).map((t) => ({ value: t, label: MOVEMENT_LABELS[t] }))}
          {...register('type')}
          error={errors.type?.message}
        />
        <Input
          id="quantity"
          label="Cantidad"
          type="number"
          min={1}
          inputMode="numeric"
          placeholder="0"
          {...register('quantity')}
          error={errors.quantity?.message}
        />
        {isIn && (
          <Select
            id="supplierId"
            label="Proveedor"
            placeholder="Sin proveedor"
            options={supplierOptions}
            {...register('supplierId')}
          />
        )}
        {isSale && (
          <Select
            id="clientId"
            label="Cliente"
            placeholder="Sin cliente"
            options={clientOptions}
            {...register('clientId')}
            error={(errors as unknown as Record<string, { message?: string }>).clientId?.message}
          />
        )}
        <Textarea
          id="note"
          label="Observación"
          placeholder="Opcional"
          {...register('note')}
          error={errors.note?.message}
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={close} disabled={processing}>
            Cancelar
          </Button>
          <Button type="submit" loading={processing} variant={isIn ? 'primary' : 'danger'}>
            {isIn ? 'Confirmar entrada' : 'Confirmar salida'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}