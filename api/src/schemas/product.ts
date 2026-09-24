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

// La oferta no puede superar al precio normal cuando ambos están definidos.
function promoLtePrice<T extends { price?: number | null; promoPrice?: number | null }>(data: T, ctx: z.RefinementCtx) {
  if (data.price != null && data.promoPrice != null && data.promoPrice > data.price) {
    ctx.addIssue({
      code: 'custom',
      path: ['promoPrice'],
      message: 'La oferta no puede ser mayor al precio normal',
    })
  }
}

export const createProductSchema = z
  .object({
    name: shortTextSchema,
    categoryId: idSchema,
    supplierId: idSchema.optional(),
    stock: stockAmountSchema('El stock inicial no puede ser negativo').default(0),
    stockMin: stockAmountSchema('El stock mínimo no puede ser negativo').default(0),
    unit: unitSchema.default('UNITS'),
    price: optionalPriceSchema('El precio no puede ser negativo'),
    promoPrice: optionalPriceSchema('La oferta no puede ser negativa'),
    imageUrl: z.string().url('La URL de la imagen no es válida').max(500).optional().or(z.literal('')),
  })
  .strict()
  .superRefine(promoLtePrice)

export const updateProductSchema = z
  .object({
    name: shortTextSchema.optional(),
    categoryId: idSchema.optional(),
    supplierId: idSchema.nullable().optional(),
    stockMin: stockAmountSchema('El stock mínimo no puede ser negativo').optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    unit: unitSchema.optional(),
    price: optionalPriceSchema('El precio no puede ser negativo'),
    promoPrice: optionalPriceSchema('La oferta no puede ser negativa'),
    imageUrl: z.string().url('La URL de la imagen no es válida').max(500).optional().nullable().or(z.literal('')),
  })
  .strict()
  .superRefine(promoLtePrice)

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
