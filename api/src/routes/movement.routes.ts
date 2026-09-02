import { Router } from 'express'
import { validate } from '../middleware/validate'
import { movementController } from '../controllers/movement.controller'
import { movementListQuerySchema } from '../schemas/movement-filter'

export const movementRoutes = Router()

movementRoutes.get('/', validate({ query: movementListQuerySchema }), movementController.list)