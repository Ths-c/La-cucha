import { z } from 'zod'
import { idSchema, longTextSchema, paginationQuerySchema, searchQuerySchema, shortTextSchema } from './common'

export const createClientSchema = z
  .object({
    name: shortTextSchema,
    contact: z
      .string()
      .trim()
      .max(120, 'El contacto es demasiado largo')
      .optional()
      .nullable(),
    notes: longTextSchema,
  })
  .strict()

export const updateClientSchema = z
  .object({
    name: shortTextSchema.optional(),
    contact: z
      .string()
      .trim()
      .max(120, 'El contacto es demasiado largo')
      .optional()
      .nullable(),
    notes: longTextSchema.nullable().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  })
  .strict()

export const clientListQuerySchema = z
  .object({
    ...paginationQuerySchema,
    search: searchQuerySchema,
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  })
  .strict()

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
export type ClientListQuery = z.infer<typeof clientListQuerySchema>
