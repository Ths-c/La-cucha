import type { NextFunction, Request, Response } from 'express'
import type { ZodTypeAny } from 'zod'

// Datos validados, disponibles en `res.locals.validated` para los controllers.
export interface ValidatedData {
  params?: unknown
  query?: unknown
  body?: unknown
}

interface ValidationSchemas {
  params?: ZodTypeAny
  query?: ZodTypeAny
  body?: ZodTypeAny
}

declare module 'express-serve-static-core' {
  interface Locals {
    validated?: ValidatedData
  }
}

// Valida params/query/body contra schemas Zod antes de llegar al controller.
// Un fallo lanza ZodError, que el error handler traduce a 400.
export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated: ValidatedData = {}
      if (schemas.params) validated.params = schemas.params.parse(req.params)
      if (schemas.query) validated.query = schemas.query.parse(req.query)
      if (schemas.body) validated.body = schemas.body.parse(req.body)
      res.locals.validated = validated
      next()
    } catch (err) {
      next(err)
    }
  }
}