import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/async-handler'
import { categoryService } from '../services/registry'
import type { CreateCategoryInput, UpdateCategoryInput } from '../schemas/category'

function body(res: Response): unknown {
  return res.locals.validated?.body ?? {}
}

export const categoryController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    res.json({ data: await categoryService.list() })
  }),

  getById: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = (res.locals.validated?.params ?? {}) as { id: number }
    res.json({ data: await categoryService.get(id) })
  }),

  create: asyncHandler(async (_req: Request, res: Response) => {
    res.status(201).json({ data: await categoryService.create(body(res) as CreateCategoryInput) })
  }),

  update: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = (res.locals.validated?.params ?? {}) as { id: number }
    res.json({ data: await categoryService.update(id, body(res) as UpdateCategoryInput) })
  }),

  delete: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = (res.locals.validated?.params ?? {}) as { id: number }
    await categoryService.delete(id)
    res.status(204).send()
  }),
}