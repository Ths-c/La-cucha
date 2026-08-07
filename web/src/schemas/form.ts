import { z } from 'zod'

const requiredNumber = (message: string) => z.coerce.number().int(message).positive(message)
const nonNegative = (message: string) => z.coerce.number().int().min(0, message)

const optionalId = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  z.coerce.number().int().positive('Selección inválida').optional(),
)

export const createProductFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(120, 'Nombre demasiado largo'),
  categoryId: requiredNumber('Seleccioná una categoría'),
  supplierId: optionalId.nullable().optional(),
  stock: nonNegative('El stock inicial no puede ser negativo').default(0),
  stockMin: nonNegative('El stock mínimo no puede ser negativo').default(0),
  imageUrl: z
    .string()
    .trim()
    .url('Ingresá una URL válida')
    .max(500)
    .optional()
    .or(z.literal('')),
})
export type CreateProductFormValues = z.infer<typeof createProductFormSchema>

export const updateProductFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(120, 'Nombre demasiado largo'),
  categoryId: requiredNumber('Seleccioná una categoría'),
  supplierId: optionalId.nullable().optional(),
  stockMin: nonNegative('El stock mínimo no puede ser negativo').default(0),
  imageUrl: z
    .string()
    .trim()
    .url('Ingresá una URL válida')
    .max(500)
    .optional()
    .or(z.literal('')),
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

export const stockInFormSchema = z.object({
  type: z.enum(['BUY', 'MANUAL_ADJUST'], { message: 'Tipo inválido' }),
  quantity: requiredNumber('La cantidad debe ser un entero positivo'),
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
  quantity: z.coerce.number().int().positive('La cantidad debe ser un entero positivo'),
  note: z.string().trim().max(1000).optional().nullable(),
})
export type StockOutFormValues = z.infer<typeof stockOutFormSchema>