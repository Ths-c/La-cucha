import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/async-handler'
import { supplierService } from '../services/registry'
import type { SupplierListQuery, CreateSupplierInput, UpdateSupplierInput } from '../schemas/supplier'

function data(res: Response, source: 'params' | 'query' | 'body'): unknown {
  return res.locals.validated?.[source] ?? {}
}

export const supplierController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    res.json({ data: await supplierService.list(data(res, 'query') as SupplierListQuery) })
  }),

  getById: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = data(res, 'params') as { id: number }
    res.json({ data: await supplierService.get(id) })
  }),

  create: asyncHandler(async (_req: Request, res: Response) => {
    res.status(201).json({ data: await supplierService.create(data(res, 'body') as CreateSupplierInput) })
  }),

  update: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = data(res, 'params') as { id: number }
    res.json({ data: await supplierService.update(id, data(res, 'body') as UpdateSupplierInput) })
  }),

  deactivate: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = data(res, 'params') as { id: number }
    res.json({ data: await supplierService.deactivate(id) })
  }),

  restore: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = data(res, 'params') as { id: number }
    res.json({ data: await supplierService.restore(id) })
  }),

  trash: asyncHandler(async (_req: Request, res: Response) => {
    res.json({ data: await supplierService.trash() })
  }),
}