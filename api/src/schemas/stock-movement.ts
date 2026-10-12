import { z } from 'zod'
import { idSchema, longTextSchema } from './common'

const movementTypeLiteral = () =>
  z.enum(['BUY', 'SALE', 'BREAKAGE', 'EXPIRY', 'DONATION', 'INTERNAL_CONSUMPTION', 'MANUAL_ADJUST'])

// Cantidades en unidades o kilogramos: positivas, hasta 3 decimales.
const quantitySchema = z.coerce
  .number()
  .positive('La cantidad debe ser mayor a 0')
  .max(1_000_000, 'La cantidad es demasiado grande')
  .refine((v) => Math.abs(v * 1000 - Math.round(v * 1000)) < 1e-6, 'Máximo 3 decimales')

// `null` (front) y `''` (select sin elegir) se tratan como ausente.
const optionalIdField = z.preprocess((v) => (v === null || v === '' ? undefined : v), idSchema.optional())

const optionalNoteField = z.preprocess(
  (v) => (v === null || v === '' ? undefined : v),
  longTextSchema,
)

const baseMovementSchema = {
  quantity: quantitySchema,
  supplierId: optionalIdField,
  note: optionalNoteField,
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
    clientId: optionalIdField,
    note: baseMovementSchema.note,
  })
  .strict()

export type StockInInput = z.infer<typeof stockInSchema>
export type StockOutInput = z.infer<typeof stockOutSchema>
