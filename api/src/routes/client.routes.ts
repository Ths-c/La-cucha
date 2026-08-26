import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { paramsIdSchema, paginationQuerySchema } from '../schemas/common'
import { clientController } from '../controllers/client.controller'
import { createClientSchema, clientListQuerySchema, updateClientSchema } from '../schemas/client'

export const clientRoutes = Router()

clientRoutes.get('/', validate({ query: clientListQuerySchema }), clientController.list)
clientRoutes.get('/trash', clientController.trash)
clientRoutes.post('/', validate({ body: createClientSchema }), clientController.create)
clientRoutes.get('/:id', validate({ params: paramsIdSchema }), clientController.getById)
clientRoutes.patch('/:id', validate({ params: paramsIdSchema, body: updateClientSchema }), clientController.update)
clientRoutes.delete('/:id', validate({ params: paramsIdSchema }), clientController.deactivate)
clientRoutes.post('/:id/restore', validate({ params: paramsIdSchema }), clientController.restore)
clientRoutes.get(
  '/:id/purchases',
  validate({
    params: paramsIdSchema,
    query: z.object(paginationQuerySchema).strict(),
  }),
  clientController.purchases,
)
