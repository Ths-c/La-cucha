import { z } from 'zod'
import { idSchema, longTextSchema } from './common'

export const createOrderPreviewSchema = z
  .object({
    supplierId: idSchema,
    items: z
      .array(
        z.object({
          supplierProductId: idSchema,
          quantity: z.coerce.number().int().positive('La cantidad debe ser un entero positivo').max(99999),
        }),
      )
      .min(1, 'El pedido debe tener al menos un ítem'),
    note: longTextSchema,
  })
  .strict()

export type CreateOrderPreviewInput = z.infer<typeof createOrderPreviewSchema>