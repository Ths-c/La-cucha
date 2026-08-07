import { prisma } from '../lib/prisma'
import { config } from '../config'
import type { Tx } from '../repositories/product.repository'
import { productRepository } from '../repositories/product.repository'
import { categoryRepository } from '../repositories/category.repository'
import { supplierRepository } from '../repositories/supplier.repository'
import { supplierProductRepository } from '../repositories/supplier-product.repository'
import { stockMovementRepository } from '../repositories/stock-movement.repository'
import { StockService } from './stock.service'
import { ProductService } from './product.service'
import { CategoryService } from './category.service'
import { SupplierService } from './supplier.service'
import { SupplierProductService } from './supplier-product.service'
import { DashboardService } from './dashboard.service'
import { OrderService } from './order.service'

// Ejecuta una función dentro de una transacción de base de datos.
const runTransaction = <T>(fn: (tx: Tx) => Promise<T>): Promise<T> => prisma.$transaction(fn)

export const stockService = new StockService({
  productRepository,
  movementRepository: stockMovementRepository,
  runTransaction,
})

export const productService = new ProductService({
  productRepository,
  categoryRepository,
  supplierRepository,
  stockService,
})

export const categoryService = new CategoryService({ categoryRepository })

export const supplierService = new SupplierService({ supplierRepository })

export const supplierProductService = new SupplierProductService({
  supplierProductRepository,
  supplierRepository,
  categoryRepository,
})

export const dashboardService = new DashboardService({
  productRepository,
  movementRepository: stockMovementRepository,
  timezone: config.timezone,
})

export const orderService = new OrderService({
  supplierRepository,
  supplierProductRepository,
})