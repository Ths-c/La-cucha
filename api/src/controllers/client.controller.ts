import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/async-handler'
import { clientService } from '../services/registry'
import type { ClientListQuery, CreateClientInput, UpdateClientInput } from '../schemas/client'

function data(res: Response, source: 'params' | 'query' | 'body'): unknown {
  return res.locals.validated?.[source] ?? {}
}

export const clientController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    res.json({ data: await clientService.list(data(res, 'query') as ClientListQuery) })
  }),

  getById: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = data(res, 'params') as { id: number }
    res.json({ data: await clientService.get(id) })
  }),

  create: asyncHandler(async (_req: Request, res: Response) => {
    res.status(201).json({ data: await clientService.create(data(res, 'body') as CreateClientInput) })
  }),

  update: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = data(res, 'params') as { id: number }
    const body = data(res, 'body') as UpdateClientInput
    res.json({ data: await clientService.update(id, body) })
  }),

  deactivate: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = data(res, 'params') as { id: number }
    res.json({ data: await clientService.deactivate(id) })
  }),

  restore: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = data(res, 'params') as { id: number }
    res.json({ data: await clientService.restore(id) })
  }),

  trash: asyncHandler(async (_req: Request, res: Response) => {
    res.json({ data: await clientService.trash() })
  }),

  purchases: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = data(res, 'params') as { id: number }
    const query = data(res, 'query') as { page?: string; limit?: string }
    res.json({ data: await clientService.purchases(id, query) })
  }),
}
