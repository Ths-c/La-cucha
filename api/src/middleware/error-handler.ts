import type { NextFunction, Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { AppError } from '../utils/app-error'
import { logger } from '../utils/logger'
import { ERROR_CODES } from '../constants/errors'

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: 'Ruta no encontrada',
    },
  })
}

// Traduce errores conocidos de Prisma a respuestas consistentes.
function mapPrismaError(err: Prisma.PrismaClientKnownRequestError): AppError {
  switch (err.code) {
    case 'P2025':
      return new AppError(404, ERROR_CODES.NOT_FOUND, 'Recurso no encontrado')
    case 'P2002': {
      const target = Array.isArray(err.meta?.target) ? err.meta?.target.join(', ') : 'valor'
      return new AppError(409, ERROR_CODES.DUPLICATE_ENTRY, `Ya existe un registro con el mismo ${target}`)
    }
    case 'P2003':
      return new AppError(409, ERROR_CODES.INVALID_RELATION, 'La relación referenciada no es válida')
    case 'P2014':
      return new AppError(409, ERROR_CODES.FORBIDDEN_DELETE, 'No se puede eliminar el recurso por sus relaciones')
    default:
      return new AppError(500, ERROR_CODES.INTERNAL_ERROR, 'Error interno del servidor')
  }
}

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    })
    return
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Datos de entrada inválidos',
        details: err.flatten(),
      },
    })
    return
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = mapPrismaError(err)
    logger.warn('error_prisma', { code: err.code, message: mapped.message })
    res.status(mapped.status).json({ error: { code: mapped.code, message: mapped.message } })
    return
  }

  // Errores inesperados: se registran, pero el stack nunca llega al cliente.
  logger.error('error_internal', {
    message: err instanceof Error ? err.message : 'Error desconocido',
  })
  res.status(500).json({
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'Error interno del servidor',
    },
  })
}