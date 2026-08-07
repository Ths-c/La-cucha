import { Router } from 'express'
import { validate } from '../middleware/validate'
import { paramsIdSchema } from '../schemas/common'
import { categoryController } from '../controllers/category.controller'
import { createCategorySchema, updateCategorySchema } from '../schemas/category'

export const categoryRoutes = Router()

categoryRoutes.get('/', categoryController.list)
categoryRoutes.post('/', validate({ body: createCategorySchema }), categoryController.create)
categoryRoutes.get('/:id', validate({ params: paramsIdSchema }), categoryController.getById)
categoryRoutes.patch('/:id', validate({ params: paramsIdSchema, body: updateCategorySchema }), categoryController.update)
categoryRoutes.delete('/:id', validate({ params: paramsIdSchema }), categoryController.delete)