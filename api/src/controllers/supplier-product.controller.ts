import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/async-handler'
import { supplierProductService } from '../services/registry'
import type { SupplierProductListQuery, CreateSupplierProductInput, UpdateSupplierProductInput } from '../schemas/supplier-product'

function data(res: Response, source: 'params' | 'query' | 'body'): unknown {
  return res.locals.validated?.[source] ?? {}
}

export const supplierProductController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = data(res, 'params') as { id: number }
    res.json({ data: await supplierProductService.list(id, data(res, 'query') as SupplierProductListQuery) })
  }),

  create: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = data(res, 'params') as { id: number }
    res.status(201).json({ data: await supplierProductService.create(id, data(res, 'body') as CreateSupplierProductInput) })
  }),

  update: asyncHandler(async (_req: Request, res: Response) => {
    const { id, itemId } = data(res, 'params') as { id: number; itemId: number }
    res.json({ data: await supplierProductService.update(id, itemId, data(res, 'body') as UpdateSupplierProductInput) })
  }),

  deactivate: asyncHandler(async (_req: Request, res: Response) => {
    const { id, itemId } = data(res, 'params') as { id: number; itemId: number }
    res.json({ data: await supplierProductService.deactivate(id, itemId) })
  }),
}