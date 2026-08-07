import type { NextFunction, Request, RequestHandler, Response } from 'express'

// Envuelve un handler async para que cualquier error llegue al error handler
// de Express (Express 5 ya soporta async, pero lo dejamos explícito).
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next)
  }