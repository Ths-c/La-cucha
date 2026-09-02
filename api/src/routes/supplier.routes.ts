import { Router } from 'express'
import { validate } from '../middleware/validate'
import { paramsIdSchema } from '../schemas/common'
import { supplierController } from '../controllers/supplier.controller'
import { createSupplierSchema, supplierListQuerySchema, updateSupplierSchema } from '../schemas/supplier'
import { supplierProductsParamsSchema } from '../schemas/supplier-product'
import { supplierProductController } from '../controllers/supplier-product.controller'
import { createSupplierProductSchema, supplierProductListQuerySchema, supplierProductItemParamsSchema, updateSupplierProductSchema } from '../schemas/supplier-product'

export const supplierRoutes = Router()

supplierRoutes.get('/', validate({ query: supplierListQuerySchema }), supplierController.list)
supplierRoutes.get('/trash', supplierController.trash)
supplierRoutes.post('/', validate({ body: createSupplierSchema }), supplierController.create)
supplierRoutes.get('/:id', validate({ params: paramsIdSchema }), supplierController.getById)
supplierRoutes.patch('/:id', validate({ params: paramsIdSchema, body: updateSupplierSchema }), supplierController.update)
supplierRoutes.delete('/:id', validate({ params: paramsIdSchema }), supplierController.deactivate)
supplierRoutes.post('/:id/restore', validate({ params: paramsIdSchema }), supplierController.restore)

// SupplierProduct (independiente de Product)
supplierRoutes.get(
  '/:id/products',
  validate({ params: supplierProductsParamsSchema, query: supplierProductListQuerySchema }),
  supplierProductController.list,
)
supplierRoutes.post(
  '/:id/products',
  validate({ params: supplierProductsParamsSchema, body: createSupplierProductSchema }),
  supplierProductController.create,
)
supplierRoutes.patch(
  '/:id/products/:itemId',
  validate({ params: supplierProductItemParamsSchema, body: updateSupplierProductSchema }),
  supplierProductController.update,
)
supplierRoutes.delete(
  '/:id/products/:itemId',
  validate({ params: supplierProductItemParamsSchema }),
  supplierProductController.deactivate,
)