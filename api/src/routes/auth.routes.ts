import { Router } from 'express'
import { validate } from '../middleware/validate'
import { loginSchema } from '../schemas/auth'
import { authController } from '../controllers/auth.controller'

export const authRoutes = Router()

// Login público (no requiere token). Emite el Bearer token del dueño.
authRoutes.post('/login', validate({ body: loginSchema }), authController.login)