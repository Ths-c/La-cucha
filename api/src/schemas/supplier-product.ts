import { z } from 'zod'
import { idSchema, longTextSchema, paginationQuerySchema, searchQuerySchema, shortTextSchema } from './common'

export const createSupplierProductSchema = z
  .object({
    name: shortTextSchema,
    notes: longTextSchema,
    categoryId: idSchema.nullable().optional(),
  })
  .strict()

export const updateSupplierProductSchema = z
  .object({
    name: shortTextSchema.optional(),
    notes: longTextSchema.nullable().optional(),
    categoryId: idSchema.nullable().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  })
  .strict()

export const supplierProductListQuerySchema = z
  .object({
    ...paginationQuerySchema,
    search: searchQuerySchema,
    categoryId: idSchema.optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  })
  .strict()

export const supplierProductsParamsSchema = z.object({
  id: idSchema,
})

// Params combinados: proveedor + item (rutas de edición/eliminación).
export const supplierProductItemParamsSchema = z.object({
  id: idSchema,
  itemId: idSchema,
})

export type CreateSupplierProductInput = z.infer<typeof createSupplierProductSchema>
export type UpdateSupplierProductInput = z.infer<typeof updateSupplierProductSchema>
export type SupplierProductListQuery = z.infer<typeof supplierProductListQuerySchema>