import { z } from 'zod'

// ID numérico desde rutas/query/body (coerce), nunca llega crudo a Prisma.
export const idSchema = z.coerce.number().int().positive('El ID debe ser un número entero positivo')

export const paramsIdSchema = z.object({
  id: idSchema,
})

// Texto libre con límites razonables.
export const shortTextSchema = z
  .string()
  .trim()
  .min(1, 'El texto no puede estar vacío')
  .max(120, 'El texto es demasiado largo')

export const optionalShortTextSchema = z
  .string()
  .trim()
  .max(120, 'El texto es demasiado largo')
  .optional()

export const longTextSchema = z
  .string()
  .trim()
  .max(1000, 'El texto es demasiado largo')
  .optional()

// Búsqueda opcional (utilizada en query de listados).
export const searchQuerySchema = z
  .string()
  .trim()
  .max(120, 'La búsqueda es demasiado larga')
  .optional()

// Página/límite opcionales en query de listados.
export const paginationQuerySchema = {
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
}