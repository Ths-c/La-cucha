import { z } from 'zod'
import { idSchema, shortTextSchema } from './common'

export const createCategorySchema = z
  .object({
    name: shortTextSchema,
  })
  .strict()

export const updateCategorySchema = z
  .object({
    name: shortTextSchema,
  })
  .strict()

export const categoryParamsSchema = z.object({
  id: idSchema,
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>