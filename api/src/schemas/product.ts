import { z } from 'zod'
import { idSchema, paginationQuerySchema, searchQuerySchema, shortTextSchema } from './common'

// Stock en unidades o kilogramos: hasta 3 decimales (ej. 1.5 kg, 0.250 kg).
const stockAmountSchema = (message: string) =>
  z.coerce
    .number()
    .min(0, message)
    .max(1_000_000, 'El valor es demasiado grande')
    .refine((v) => Math.abs(v * 1000 - Math.round(v * 1000)) < 1e-6, 'Máximo 3 decimales')

// Precio opcional con centavos. '' (form) se trata como ausente.
const optionalPriceSchema = (message: string) =>
  z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.coerce
      .number()
      .min(0, message)
      .max(999_999_999, 'El precio es demasiado grande')
      .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, 'Máximo 2 decimales')
      .optional()
      .nullable(),
  )

const unitSchema = z.enum(['UNITS', 'KG'])

// Cada producto puede tener precio por kilo y/o precio por bolsa.
// Son independientes (ninguno tapa al otro) pero se exige al menos uno.
function atLeastOnePrice<T extends { price?: number | null; bagPrice?: number | null }>(data: T, ctx: z.RefinementCtx) {
  if (data.price == null && data.bagPrice == null) {
    ctx.addIssue({
      code: 'custom',
      path: ['price'],
      message: 'Cargá al menos un precio (por kilo o por bolsa)',
    })
  }
}

export const createProductSchema = z
  .object({
    name: shortTextSchema,
    categoryId: idSchema,
    supplierId: z.preprocess((v) => (v === null || v === '' ? undefined : v), idSchema.optional()),
    stock: stockAmountSchema('El stock inicial no puede ser negativo').default(0),
    stockMin: stockAmountSchema('El stock mínimo no puede ser negativo').default(0),
    unit: unitSchema.default('UNITS'),
    price: optionalPriceSchema('El precio no puede ser negativo'),
    bagPrice: optionalPriceSchema('El precio por bolsa no puede ser negativo'),
    imageUrl: z.string().url('La URL de la imagen no es válida').max(500).optional().or(z.literal('')),
  })
  .strict()
  .superRefine(atLeastOnePrice)

export const updateProductSchema = z
  .object({
    name: shortTextSchema.optional(),
    categoryId: idSchema.optional(),
    supplierId: z.preprocess((v) => (v === '' ? undefined : v), idSchema.nullable().optional()),
    stockMin: stockAmountSchema('El stock mínimo no puede ser negativo').optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    unit: unitSchema.optional(),
    price: optionalPriceSchema('El precio no puede ser negativo'),
    bagPrice: optionalPriceSchema('El precio por bolsa no puede ser negativo'),
    imageUrl: z.string().url('La URL de la imagen no es válida').max(500).optional().nullable().or(z.literal('')),
  })
  .strict()
  .superRefine((data, ctx) => {
    // En PATCH los campos son opcionales: solo validar "al menos uno"
    // cuando el payload trae explícitamente alguno de los dos precios.
    if (data.price !== undefined || data.bagPrice !== undefined) {
      atLeastOnePrice(data, ctx)
    }
  })

export const productListQuerySchema = z
  .object({
    ...paginationQuerySchema,
    search: searchQuerySchema,
    categoryId: idSchema.optional(),
    supplierId: idSchema.optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    lowStock: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => v === 'true'),
  })
  .strict()

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type ProductListQuery = z.infer<typeof productListQuerySchema>
