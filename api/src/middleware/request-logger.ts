import type { NextFunction, Request, Response } from 'express'
import { logger } from '../utils/logger'

// Registro básico de cada request HTTP (método, ruta, status, duración, IP).
// No registra cuerpos (evita posibles datos sensibles en el payload).
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint()
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6
    logger.info('http', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs),
    })
  })
  next()
}