import { z } from 'zod'

const requiredNumber = (message: string) => z.coerce.number({ message }).int(message).positive(message)
const nonNegative = (message: string) =>
  z.coerce
    .number({ message })
    .min(0, message)
    .max(1_000_000, 'El valor es demasiado grande')
    .refine((v) => Math.abs(v * 1000 - Math.round(v * 1000)) < 1e-6, 'Máximo 3 decimales')

const positiveAmount = (message: string) =>
  z.coerce
    .number({ message })
    .positive(message)
    .max(1_000_000, 'La cantidad es demasiado grande')
    .refine((v) => Math.abs(v * 1000 - Math.round(v * 1000)) < 1e-6, 'Máximo 3 decimales')

const optionalPrice = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  z.coerce
    .number()
    .min(0, 'El precio no puede ser negativo')
    .max(999_999_999, 'El precio es demasiado grande')
    .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, 'Máximo 2 decimales')
    .optional(),
)

const optionalId = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  z.coerce.number().int().positive('Selección inválida').optional(),
)

export const createProductFormSchema = z
  .object({
    name: z.string().trim().min(1, 'El nombre es obligatorio').max(120, 'Nombre demasiado largo'),
    categoryId: requiredNumber('Seleccioná una categoría'),
    supplierId: optionalId.nullable().optional(),
    stock: nonNegative('El stock inicial no puede ser negativo').default(0),
    stockMin: nonNegative('El stock mínimo no puede ser negativo').default(0),
    unit: z.enum(['UNITS', 'KG']).default('UNITS'),
    price: optionalPrice,
    promoPrice: optionalPrice,
    imageUrl: z
      .string()
      .trim()
      .url('Ingresá una URL válida')
      .max(500)
      .optional()
      .or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.price != null && data.promoPrice != null && data.promoPrice > data.price) {
      ctx.addIssue({ code: 'custom', path: ['promoPrice'], message: 'La oferta no puede ser mayor al precio normal' })
    }
  })
export type CreateProductFormValues = z.infer<typeof createProductFormSchema>

export const updateProductFormSchema = z
  .object({
    name: z.string().trim().min(1, 'El nombre es obligatorio').max(120, 'Nombre demasiado largo'),
    categoryId: requiredNumber('Seleccioná una categoría'),
    supplierId: optionalId.nullable().optional(),
    stockMin: nonNegative('El stock mínimo no puede ser negativo').default(0),
    unit: z.enum(['UNITS', 'KG']).optional(),
    price: optionalPrice,
    promoPrice: optionalPrice,
    imageUrl: z
      .string()
      .trim()
      .url('Ingresá una URL válida')
      .max(500)
      .optional()
      .or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.price != null && data.promoPrice != null && data.promoPrice > data.price) {
      ctx.addIssue({ code: 'custom', path: ['promoPrice'], message: 'La oferta no puede ser mayor al precio normal' })
    }
  })
export type UpdateProductFormValues = z.infer<typeof updateProductFormSchema>

export const orderSupplierFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(120, 'Nombre demasiado largo'),
  whatsappNumber: z
    .string()
    .trim()
    .min(8, 'El número es demasiado corto')
    .max(20, 'El número es demasiado largo'),
  notes: z.string().trim().max(1000).optional().nullable(),
})
export type SupplierFormValues = z.infer<typeof orderSupplierFormSchema>

export const supplierProductFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(120, 'Nombre demasiado largo'),
  categoryId: optionalId.nullable().optional(),
  notes: z.string().trim().max(1000).optional().nullable(),
})
export type SupplierProductFormValues = z.infer<typeof supplierProductFormSchema>

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(120, 'Nombre demasiado largo'),
})
export type CategoryFormValues = z.infer<typeof categoryFormSchema>

export const clientFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(120, 'Nombre demasiado largo'),
  contact: z.string().trim().max(120, 'El contacto es demasiado largo').optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
})
export type ClientFormValues = z.infer<typeof clientFormSchema>

export const stockInFormSchema = z.object({
  type: z.enum(['BUY', 'MANUAL_ADJUST'], { message: 'Tipo inválido' }),
  quantity: positiveAmount('La cantidad debe ser mayor a 0'),
  supplierId: optionalId.nullable().optional(),
  note: z.string().trim().max(1000).optional().nullable(),
})
export type StockInFormValues = z.infer<typeof stockInFormSchema>

const stockOutType = z.enum(
  ['SALE', 'BREAKAGE', 'EXPIRY', 'DONATION', 'INTERNAL_CONSUMPTION', 'MANUAL_ADJUST'],
  { message: 'Tipo inválido' },
)

export const stockOutFormSchema = z.object({
  type: stockOutType,
  quantity: positiveAmount('La cantidad debe ser mayor a 0'),
  clientId: optionalId.nullable().optional(),
  note: z.string().trim().max(1000).optional().nullable(),
})
export type StockOutFormValues = z.infer<typeof stockOutFormSchema>