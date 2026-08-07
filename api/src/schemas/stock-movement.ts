import { z } from 'zod'
import { idSchema, longTextSchema } from './common'

const movementTypeLiteral = () =>
  z.enum(['BUY', 'SALE', 'BREAKAGE', 'EXPIRY', 'DONATION', 'INTERNAL_CONSUMPTION', 'MANUAL_ADJUST'])

const baseMovementSchema = {
  quantity: z.coerce.number().int().positive('La cantidad debe ser un entero positivo'),
  supplierId: idSchema.optional(),
  note: longTextSchema,
}

// Entrada: solo tipos que incrementan stock.
export const stockInSchema = z
  .object({
    type: movementTypeLiteral().refine((t) => t === 'BUY' || t === 'MANUAL_ADJUST', {
      message: 'Tipo de movimiento no válido para una entrada',
    }),
    quantity: baseMovementSchema.quantity,
    supplierId: baseMovementSchema.supplierId,
    note: baseMovementSchema.note,
  })
  .strict()

// Salida: solo tipos que reducen stock.
export const stockOutSchema = z
  .object({
    type: movementTypeLiteral().refine(
      (t) =>
        t === 'SALE' ||
        t === 'BREAKAGE' ||
        t === 'EXPIRY' ||
        t === 'DONATION' ||
        t === 'INTERNAL_CONSUMPTION' ||
        t === 'MANUAL_ADJUST',
      { message: 'Tipo de movimiento no permitido para una salida' },
    ),
    quantity: baseMovementSchema.quantity,
    supplierId: baseMovementSchema.supplierId,
    note: baseMovementSchema.note,
  })
  .strict()

export type StockInInput = z.infer<typeof stockInSchema>
export type StockOutInput = z.infer<typeof stockOutSchema>