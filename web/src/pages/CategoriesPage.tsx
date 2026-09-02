import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/features/categories/hooks'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { PlusIcon, EditIcon } from '@/components/icons'
import { categoryFormSchema, type CategoryFormValues } from '@/schemas/form'
import type { Category } from '@/types/domain'

export function CategoriesPage() {
  const toast = useToast()
  const { confirm, ConfirmationDialog } = useConfirm()
  const categories = useCategories()

  const [modalState, setModalState] = useState<{ open: boolean; category: Category | null }>({
    open: false,
    category: null,
  })

  const create = useCreateCategory()
  const update = useUpdateCategory()
  const remove = useDeleteCategory()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema) as unknown as Resolver<CategoryFormValues>,
    defaultValues: { name: '' },
  })

  useEffect(() => {
    if (modalState.open) {
      reset({ name: modalState.category?.name ?? '' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalState.open, modalState.category])

  const openCreate = () => setModalState({ open: true, category: null })
  const openEdit = (cat: Category) => setModalState({ open: true, category: cat })
  const close = () => setModalState((s) => ({ ...s, open: false }))

  const onDelete = async (cat: Category) => {
    const ok = await confirm({
      title: 'Eliminar categoría',
      description: `¿Eliminar "${cat.name}"? No se puede eliminar si tiene productos asociados.`,
      confirmLabel: 'Eliminar',
    })
    if (!ok) return
    try {
      await remove.mutateAsync(cat.id)
      toast.success('Categoría eliminada')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar la categoría.')
    }
  }

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      if (modalState.category) {
        await update.mutateAsync({ id: modalState.category.id, input: { name: values.name } })
        toast.success('Categoría actualizada')
      } else {
        await create.mutateAsync({ name: values.name })
        toast.success('Categoría creada')
      }
      close()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar la categoría.')
    }
  }

  const processing = isSubmitting || create.isPending || update.isPending

  return (
    <div>
      <PageHeader
        title="Categorías"
        subtitle="Organizá productos y listados de proveedores por categoría"
        action={
          <Button onClick={openCreate}>
            <PlusIcon className="size-4" />
            <span className="hidden sm:inline">Nueva</span>
          </Button>
        }
      />

      {categories.isError && <ErrorState onRetry={() => categories.refetch()} />}

      {categories.isLoading && <LoadingState message="Cargando categorías..." />}

      {!categories.isLoading && !categories.isError && categories.data && (
        categories.data.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Categoría</th>
                  <th className="px-4 py-2.5 font-medium">Estado</th>
                  <th className="px-4 py-2.5 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.data.map((cat) => (
                  <tr key={cat.id}>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{cat.name}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone="green">Activa</Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => openEdit(cat)}>
                          <EditIcon className="size-4" />
                          <span className="hidden sm:inline">Editar</span>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => onDelete(cat)}>
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="🏷️" title="No hay categorías." description="Creá una categoría para comenzar." />
        )
      )}

      <Modal
        open={modalState.open}
        onClose={close}
        title={modalState.category ? 'Editar categoría' : 'Nueva categoría'}
        description="Las categorías agrupan productos de la tienda y listados de proveedores."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            id="category-name"
            label="Nombre"
            placeholder="Ej: Alimentos, Limpieza, Bebidas"
            autoFocus
            {...register('name')}
            error={errors.name?.message}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={close} disabled={processing}>
              Cancelar
            </Button>
            <Button type="submit" loading={processing}>
              {modalState.category ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationDialog />
    </div>
  )
}