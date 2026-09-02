import { z } from 'zod'
import { idSchema, paginationQuerySchema } from './common'

export const movementListQuerySchema = z
  .object({
    ...paginationQuerySchema,
    type: z.enum(['BUY', 'SALE', 'BREAKAGE', 'EXPIRY', 'DONATION', 'INTERNAL_CONSUMPTION', 'MANUAL_ADJUST']).optional(),
    productId: idSchema.optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .strict()

export const productMovementsQuerySchema = z
  .object({
    ...paginationQuerySchema,
    type: z.enum(['BUY', 'SALE', 'BREAKAGE', 'EXPIRY', 'DONATION', 'INTERNAL_CONSUMPTION', 'MANUAL_ADJUST']).optional(),
  })
  .strict()

export type MovementListQuery = z.infer<typeof movementListQuerySchema>
export type ProductMovementsQuery = z.infer<typeof productMovementsQuerySchema>