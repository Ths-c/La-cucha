import { z } from 'zod'
import { idSchema, longTextSchema, paginationQuerySchema, searchQuerySchema, shortTextSchema } from './common'

// Número de WhatsApp: se acepta cualquier formato visual; se normaliza en el
// service con normalizeWhatsApp (formato +<código><número>).
const whatsappSchema = z
  .string()
  .trim()
  .min(8, 'El número de WhatsApp es demasiado corto')
  .max(20, 'El número de WhatsApp es demasiado largo')

export const createSupplierSchema = z
  .object({
    name: shortTextSchema,
    whatsappNumber: whatsappSchema,
    notes: longTextSchema,
  })
  .strict()

export const updateSupplierSchema = z
  .object({
    name: shortTextSchema.optional(),
    whatsappNumber: whatsappSchema.optional(),
    notes: longTextSchema.nullable().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  })
  .strict()

export const supplierListQuerySchema = z
  .object({
    ...paginationQuerySchema,
    search: searchQuerySchema,
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  })
  .strict()

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>
export type SupplierListQuery = z.infer<typeof supplierListQuerySchema>