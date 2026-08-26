import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateClient, useUpdateClient } from '@/features/clients/hooks'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { clientFormSchema, type ClientFormValues } from '@/schemas/form'
import type { Client } from '@/types/domain'

interface ClientFormModalProps {
  open: boolean
  onClose: () => void
  client?: Client | null
}

export function ClientFormModal({ open, onClose, client }: ClientFormModalProps) {
  const isEdit = !!client
  const toast = useToast()
  const createMutation = useCreateClient()
  const updateMutation = useUpdateClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: { name: '', contact: '', notes: '' },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: client?.name ?? '',
        contact: client?.contact ?? '',
        notes: client?.notes ?? '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client])

  const onSubmit = async (values: ClientFormValues) => {
    try {
      if (isEdit && client) {
        await updateMutation.mutateAsync({
          id: client.id,
          input: {
            name: values.name,
            contact: values.contact || null,
            notes: values.notes || null,
          },
        })
        toast.success('Cliente actualizado')
      } else {
        await createMutation.mutateAsync({
          name: values.name,
          contact: values.contact || null,
          notes: values.notes || undefined,
        })
        toast.success('Cliente creado')
      }
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar el cliente.')
    }
  }

  const processing = isSubmitting || createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar cliente' : 'Nuevo cliente'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          id="client-name"
          label="Nombre"
          placeholder="Ej: Juan Pérez"
          {...register('name')}
          error={errors.name?.message}
        />
        <Input
          id="client-contact"
          label="Contacto"
          placeholder="Teléfono o email"
          {...register('contact')}
          error={errors.contact?.message}
        />
        <Textarea
          id="client-notes"
          label="Notas"
          placeholder="Opcional"
          {...register('notes')}
          error={errors.notes?.message}
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={processing}>
            Cancelar
          </Button>
          <Button type="submit" loading={processing}>
            {isEdit ? 'Guardar cambios' : 'Crear cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
