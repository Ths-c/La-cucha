import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/async-handler'
import { stockMovementRepository } from '../repositories/stock-movement.repository'
import { parsePagination, buildPaginated } from '../utils/pagination'
import type { MovementListQuery } from '../schemas/movement-filter'

export const movementController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const query = (res.locals.validated?.query ?? {}) as MovementListQuery
    const pagination = parsePagination(String(query.page ?? ''), String(query.limit ?? ''))
    const filters = { type: query.type, productId: query.productId, from: query.from, to: query.to }
    const [items, total] = await Promise.all([
      stockMovementRepository.list({ ...filters, skip: pagination.skip, limit: pagination.limit }),
      stockMovementRepository.count(filters),
    ])
    res.json({ data: buildPaginated(items, total, pagination) })
  }),
}