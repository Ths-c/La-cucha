import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './config'
import { requestLogger } from './middleware/request-logger'
import { errorHandler, notFoundHandler } from './middleware/error-handler'
import { requireAuth } from './middleware/auth'
import { authRoutes } from './routes/auth.routes'
import { productRoutes } from './routes/product.routes'
import { categoryRoutes } from './routes/category.routes'
import { supplierRoutes } from './routes/supplier.routes'
import { clientRoutes } from './routes/client.routes'
import { movementRoutes } from './routes/movement.routes'
import { dashboardRoutes, orderRoutes } from './routes/dashboard-order.routes'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  if (config.env !== 'test') app.use(requestLogger)
  app.use(helmet())
  app.use(
    cors({
      origin: config.corsOrigin.split(',').map((o) => o.trim()),
    }),
  )
  app.use(express.json())

  // Públicas: health y login.
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })
  app.use('/api/auth', authRoutes)
  app.get('/api/auth/me', requireAuth, (_req, res) => {
    res.json({ data: { email: config.auth.email } })
  })

  // Rutas administrativas: requieren autenticación (único dueño).
  app.use('/api/products', requireAuth, productRoutes)
  app.use('/api/categories', requireAuth, categoryRoutes)
  app.use('/api/suppliers', requireAuth, supplierRoutes)
  app.use('/api/clients', requireAuth, clientRoutes)
  app.use('/api/movements', requireAuth, movementRoutes)
  app.use('/api/dashboard', requireAuth, dashboardRoutes)
  app.use('/api/orders', requireAuth, orderRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}