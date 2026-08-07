import type { NextFunction, Request, Response } from 'express'
import { config } from '../config'
import { AppError } from '../utils/app-error'
import { ERROR_CODES } from '../constants/errors'
import { verifyToken } from '../utils/crypto'

function readBearerToken(req: Request): string | null {
  const header = req.headers.authorization
  if (!header) return null
  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

/**
 * Protege las rutas administrativas: exige un Bearer token válido firmado con
 * `AUTH_SECRET`. Si `AUTH_SECRET` no está configurado, responde 503 para dejar
 * en claro que el servidor no está preparado (nunca pasa por alto la auth).
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!config.auth.secret) {
    next(
      new AppError(
        503,
        ERROR_CODES.INTERNAL_ERROR,
        'Autenticación no configurada (falta AUTH_SECRET en el servidor)',
      ),
    )
    return
  }

  const token = readBearerToken(req)
  if (!token) {
    next(new AppError(401, ERROR_CODES.UNAUTHENTICATED, 'No autorizado'))
    return
  }

  const payload = verifyToken(token, config.auth.secret)
  if (!payload) {
    next(new AppError(401, ERROR_CODES.UNAUTHENTICATED, 'Token inválido o expirado'))
    return
  }

  next()
}