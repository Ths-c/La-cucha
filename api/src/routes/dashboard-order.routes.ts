import { Router } from 'express'
import { validate } from '../middleware/validate'
import { dashboardController } from '../controllers/dashboard.controller'
import { createOrderPreviewSchema } from '../schemas/order'
import { orderController } from '../controllers/order.controller'

export const dashboardRoutes = Router()
export const orderRoutes = Router()

dashboardRoutes.get('/summary', dashboardController.summary)

orderRoutes.post('/preview', validate({ body: createOrderPreviewSchema }), orderController.preview)