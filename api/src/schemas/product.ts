import { z } from 'zod'
import { idSchema, optionalShortTextSchema, paginationQuerySchema, searchQuerySchema, shortTextSchema } from './common'

export const createProductSchema = z
  .object({
    name: shortTextSchema,
    categoryId: idSchema,
    supplierId: idSchema.optional(),
    stock: z.coerce.number().int().min(0, 'El stock inicial no puede ser negativo').default(0),
    stockMin: z.coerce.number().int().min(0, 'El stock mínimo no puede ser negativo').default(0),
    imageUrl: z.string().url('La URL de la imagen no es válida').max(500).optional().or(z.literal('')),
  })
  .strict()

export const updateProductSchema = z
  .object({
    name: shortTextSchema.optional(),
    categoryId: idSchema.optional(),
    supplierId: idSchema.nullable().optional(),
    stockMin: z.coerce.number().int().min(0, 'El stock mínimo no puede ser negativo').optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    imageUrl: z.string().url('La URL de la imagen no es válida').max(500).optional().nullable().or(z.literal('')),
  })
  .strict()

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