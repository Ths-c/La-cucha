import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/async-handler'
import { orderService } from '../services/registry'
import type { CreateOrderPreviewInput } from '../schemas/order'

export const orderController = {
  preview: asyncHandler(async (_req: Request, res: Response) => {
    const body = (res.locals.validated?.body ?? {}) as CreateOrderPreviewInput
    res.json({ data: await orderService.preview(body) })
  }),
}