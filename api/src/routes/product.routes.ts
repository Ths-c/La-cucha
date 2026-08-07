import { Router } from 'express'
import { validate } from '../middleware/validate'
import { paramsIdSchema } from '../schemas/common'
import { productController } from '../controllers/product.controller'
import { createProductSchema, productListQuerySchema, updateProductSchema } from '../schemas/product'
import { stockInSchema, stockOutSchema } from '../schemas/stock-movement'
import { productMovementsQuerySchema } from '../schemas/movement-filter'

export const productRoutes = Router()

productRoutes.get('/', validate({ query: productListQuerySchema }), productController.list)
productRoutes.get('/trash', productController.trash)
productRoutes.post('/', validate({ body: createProductSchema }), productController.create)
productRoutes.get('/:id', validate({ params: paramsIdSchema }), productController.getById)
productRoutes.patch('/:id', validate({ params: paramsIdSchema, body: updateProductSchema }), productController.update)
productRoutes.delete('/:id', validate({ params: paramsIdSchema }), productController.deactivate)
productRoutes.post('/:id/restore', validate({ params: paramsIdSchema }), productController.restore)
productRoutes.post('/:id/stock/in', validate({ params: paramsIdSchema, body: stockInSchema }), productController.stockIn)
productRoutes.post('/:id/stock/out', validate({ params: paramsIdSchema, body: stockOutSchema }), productController.stockOut)
productRoutes.get(
  '/:id/movements',
  validate({ params: paramsIdSchema, query: productMovementsQuerySchema }),
  productController.movements,
)