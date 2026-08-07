import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/async-handler'
import { productService, stockService } from '../services/registry'
import type { ProductListQuery, CreateProductInput, UpdateProductInput } from '../schemas/product'
import type { StockInInput, StockOutInput } from '../schemas/stock-movement'
import type { ProductMovementsQuery } from '../schemas/movement-filter'
import { stockMovementRepository } from '../repositories/stock-movement.repository'
import { parsePagination, buildPaginated } from '../utils/pagination'

function data(res: Response, source: 'params' | 'query' | 'body'): unknown {
  return res.locals.validated?.[source] ?? {}
}

export const productController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const query = data(res, 'query') as ProductListQuery
    res.json({ data: await productService.list(query) })
  }),

  getById: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = data(res, 'params') as { id: number }
    res.json({ data: await productService.get(id) })
  }),

  create: asyncHandler(async (_req: Request, res: Response) => {
    const body = data(res, 'body') as CreateProductInput
    res.status(201).json({ data: await productService.create(body) })
  }),

  update: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = data(res, 'params') as { id: number }
    const body = data(res, 'body') as UpdateProductInput
    res.json({ data: await productService.update(id, body) })
  }),

  deactivate: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = data(res, 'params') as { id: number }
    res.json({ data: await productService.deactivate(id) })
  }),

  restore: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = data(res, 'params') as { id: number }
    res.json({ data: await productService.restore(id) })
  }),

  trash: asyncHandler(async (_req: Request, res: Response) => {
    res.json({ data: await productService.trash() })
  }),

  stockIn: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = data(res, 'params') as { id: number }
    const body = data(res, 'body') as StockInInput
    res.json({ data: await stockService.stockIn(id, body) })
  }),

  stockOut: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = data(res, 'params') as { id: number }
    const body = data(res, 'body') as StockOutInput
    res.json({ data: await stockService.stockOut(id, body) })
  }),

  movements: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = data(res, 'params') as { id: number }
    const query = data(res, 'query') as ProductMovementsQuery
    const pagination = parsePagination(String(query.page ?? ''), String(query.limit ?? ''))
    const [items, total] = await Promise.all([
      stockMovementRepository.listByProduct(id, query.type, pagination.skip, pagination.limit),
      stockMovementRepository.countByProduct(id, query.type),
    ])
    res.json({ data: buildPaginated(items, total, pagination) })
  }),
}