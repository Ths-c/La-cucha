import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateSupplierProduct, useUpdateSupplierProduct } from '@/features/suppliers/hooks'
import { useCategories } from '@/features/categories/hooks'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { supplierProductFormSchema, type SupplierProductFormValues } from '@/schemas/form'
import type { SupplierProduct } from '@/types/domain'

interface SupplierProductModalProps {
  open: boolean
  onClose: () => void
  supplierId: number
  item?: SupplierProduct | null
}

export function SupplierProductModal({ open, onClose, supplierId, item }: SupplierProductModalProps) {
  const toast = useToast()
  const create = useCreateSupplierProduct()
  const update = useUpdateSupplierProduct()
  const { data: categories } = useCategories()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierProductFormValues>({
    resolver: zodResolver(supplierProductFormSchema) as unknown as Resolver<SupplierProductFormValues>,
    defaultValues: { name: '', categoryId: undefined, notes: '' },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: item?.name ?? '',
        categoryId: item?.categoryId ?? undefined,
        notes: item?.notes ?? '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item])

  const onSubmit = async (values: SupplierProductFormValues) => {
    try {
      const input = { name: values.name, categoryId: values.categoryId ?? undefined, notes: values.notes?.trim() || undefined }
      if (item) {
        await update.mutateAsync({ supplierId, itemId: item.id, input })
        toast.success('Producto actualizado')
      } else {
        await create.mutateAsync({ supplierId, input })
        toast.success('Producto agregado al listado')
      }
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar el producto.')
    }
  }

  const processing = isSubmitting || create.isPending || update.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? 'Editar producto del proveedor' : 'Agregar producto al listado'}
      description="Para armar pedidos por WhatsApp a este proveedor."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input id="sp-name" label="Nombre" placeholder="Ej: Whiskas Adulto 1kg" {...register('name')} error={errors.name?.message} />
        <Select
          id="sp-category"
          label="Categoría"
          placeholder="Sin categoría"
          options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
          {...register('categoryId')}
          error={errors.categoryId?.message}
        />
        <Textarea id="sp-notes" label="Notas" placeholder="Código interno, presentación, etc." {...register('notes')} error={errors.notes?.message} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={processing}>
            Cancelar
          </Button>
          <Button type="submit" loading={processing}>
            {item ? 'Guardar' : 'Agregar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}