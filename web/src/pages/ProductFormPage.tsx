import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useCreateProduct,
  useProduct,
  useUpdateProduct,
} from '@/features/products/hooks'
import { useCategories } from '@/features/categories/hooks'
import { useSuppliers } from '@/features/suppliers/hooks'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { ErrorState, LoadingState } from '@/components/ui/states'
import {
  createProductFormSchema,
  updateProductFormSchema,
  type CreateProductFormValues,
} from '@/schemas/form'

export function ProductFormPage() {
  const { id } = useParams()
  const productId = Number(id)
  const isEdit = !!id
  const navigate = useNavigate()
  const toast = useToast()

  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()
  const { data: categories } = useCategories()
  const { data: suppliers } = useSuppliers({ status: 'ACTIVE', limit: 100 })
  const { data: product, isLoading, isError } = useProduct(productId)

  const schema = isEdit ? updateProductFormSchema : createProductFormSchema

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductFormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<CreateProductFormValues>,
    defaultValues: {
      name: '',
      categoryId: undefined,
      supplierId: undefined,
      stock: 0,
      stockMin: 0,
      imageUrl: '',
    },
  })

  useEffect(() => {
    if (isEdit && product) {
      reset({
        name: product.name,
        categoryId: product.categoryId,
        supplierId: product.supplierId ?? undefined,
        stockMin: product.stockMin,
        imageUrl: product.imageUrl ?? '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, product])

  const categoryOptions = (categories ?? []).map((c) => ({ value: c.id, label: c.name }))
  const supplierOptions = (suppliers?.items ?? []).map((s) => ({ value: s.id, label: s.name }))

  const onSubmit = async (values: CreateProductFormValues) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: productId,
          input: {
            name: values.name,
            categoryId: Number(values.categoryId),
            supplierId: values.supplierId ?? null,
            stockMin: Number(values.stockMin ?? 0),
            imageUrl: values.imageUrl?.trim() || null,
          },
        })
        toast.success('Producto actualizado')
        navigate(`/products/${productId}`)
      } else {
        const created = await createMutation.mutateAsync({
          name: values.name,
          categoryId: Number(values.categoryId),
          supplierId: values.supplierId ?? null,
          stock: Number(values.stock ?? 0),
          stockMin: Number(values.stockMin ?? 0),
          imageUrl: values.imageUrl?.trim() || undefined,
        })
        toast.success('Producto creado')
        navigate(`/products/${created.id}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar el producto.')
    }
  }

  const processing = isSubmitting || createMutation.isPending || updateMutation.isPending

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={isEdit ? 'Editar producto' : 'Nuevo producto'} />

      {isEdit && isLoading && <LoadingState message="Cargando producto..." />}
      {isEdit && isError && <ErrorState message="No se pudo cargar el producto." />}

      {(!isEdit || product) && (
        <Card>
          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input
                id="name"
                label="Nombre"
                placeholder="Ej: Dog Chow Adulto 15kg"
                {...register('name')}
                error={errors.name?.message}
              />
              <Select
                id="categoryId"
                label="Categoría"
                placeholder="Seleccioná una categoría"
                options={categoryOptions}
                {...register('categoryId')}
                error={errors.categoryId?.message}
              />
              <Select
                id="supplierId"
                label="Proveedor principal"
                placeholder="Sin proveedor"
                options={supplierOptions}
                {...register('supplierId')}
              />
              {!isEdit && (
                <Input
                  id="stock"
                  label="Stock inicial"
                  type="number"
                  min={0}
                  hint="Solo se define al crear; luego se gestiona con entradas/salidas."
                  {...register('stock')}
                  error={errors.stock?.message}
                />
              )}
              <Input
                id="stockMin"
                label="Stock mínimo"
                type="number"
                min={0}
                hint="Aviso visual cuando el stock baja de este valor."
                {...register('stockMin')}
                error={errors.stockMin?.message}
              />
              <Input
                id="imageUrl"
                label="Imagen (URL)"
                placeholder="https://..."
                {...register('imageUrl')}
                error={errors.imageUrl?.message}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => navigate(-1)} disabled={processing}>
                  Cancelar
                </Button>
                <Button type="submit" loading={processing}>
                  {isEdit ? 'Guardar cambios' : 'Crear producto'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}
    </div>
  )
}