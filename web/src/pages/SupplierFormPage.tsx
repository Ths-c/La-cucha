import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useCreateSupplier, useSupplier, useUpdateSupplier } from '@/features/suppliers/hooks'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { ErrorState, LoadingState } from '@/components/ui/states'
import { orderSupplierFormSchema, type SupplierFormValues } from '@/schemas/form'

export function SupplierFormPage() {
  const { id } = useParams()
  const supplierId = Number(id)
  const isEdit = !!id
  const navigate = useNavigate()
  const toast = useToast()

  const createMutation = useCreateSupplier()
  const updateMutation = useUpdateSupplier()
  const { data: supplier, isLoading, isError } = useSupplier(supplierId)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(orderSupplierFormSchema),
    defaultValues: { name: '', whatsappNumber: '', notes: '' },
  })

  useEffect(() => {
    if (isEdit && supplier) {
      reset({
        name: supplier.name,
        whatsappNumber: supplier.whatsappNumber,
        notes: supplier.notes ?? '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, supplier])

  const onSubmit = async (values: SupplierFormValues) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: supplierId,
          input: { name: values.name, whatsappNumber: values.whatsappNumber, notes: values.notes || null },
        })
        toast.success('Proveedor actualizado')
      } else {
        await createMutation.mutateAsync({
          name: values.name,
          whatsappNumber: values.whatsappNumber,
          notes: values.notes || undefined,
        })
        toast.success('Proveedor creado')
      }
      navigate('/suppliers')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar el proveedor.')
    }
  }

  const processing = isSubmitting || createMutation.isPending || updateMutation.isPending

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={isEdit ? 'Editar proveedor' : 'Nuevo proveedor'} />

      {isEdit && isLoading && <LoadingState message="Cargando proveedor..." />}
      {isEdit && isError && <ErrorState message="No se pudo cargar el proveedor." />}

      {(!isEdit || supplier) && (
        <Card>
          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input id="name" label="Nombre" placeholder="Ej: Purina Distribuidora" {...register('name')} error={errors.name?.message} />
              <Input
                id="whatsappNumber"
                label="Número de WhatsApp"
                placeholder="+54 9 11 5555-6677"
                inputMode="tel"
                hint="Se normaliza automáticamente (formato +código país)."
                {...register('whatsappNumber')}
                error={errors.whatsappNumber?.message}
              />
              <Textarea id="notes" label="Notas" placeholder="Condiciones, días de entrega, etc." {...register('notes')} error={errors.notes?.message} />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => navigate(-1)} disabled={processing}>
                  Cancelar
                </Button>
                <Button type="submit" loading={processing}>
                  {isEdit ? 'Guardar cambios' : 'Crear proveedor'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}
    </div>
  )
}