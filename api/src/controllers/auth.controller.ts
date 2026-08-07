import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/async-handler'
import { config } from '../config'
import { AuthService } from '../services/auth.service'
import { ERROR_CODES } from '../constants/errors'
import { AppError } from '../utils/app-error'
import type { LoginInput } from '../schemas/auth'

const authService = new AuthService({
  email: config.auth.email,
  password: config.auth.password,
  secret: config.auth.secret,
  tokenTtlSeconds: config.auth.tokenTtlSeconds,
})

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const input = (res.locals.validated?.body ?? req.body) as LoginInput
    const result = await authService.login(input)
    res.json({ data: result })
  }),

  // Útil para que el frontend valide el token guardado al cargar.
  me: (_req: Request, res: Response) => {
    if (!config.auth.email) {
      throw new AppError(500, ERROR_CODES.INTERNAL_ERROR, 'Autenticación no configurada')
    }
    res.json({ data: { email: config.auth.email } })
  },
}