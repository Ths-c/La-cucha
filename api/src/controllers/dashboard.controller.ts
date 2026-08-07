import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/async-handler'
import { dashboardService } from '../services/registry'

export const dashboardController = {
  summary: asyncHandler(async (_req: Request, res: Response) => {
    res.json({ data: await dashboardService.summary() })
  }),
}