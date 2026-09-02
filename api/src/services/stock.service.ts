import { AppError } from '../utils/app-error'
import { ERROR_CODES } from '../constants/errors'
import type { MovementType } from '@prisma/client'
import type { StockMovementRepository } from '../repositories/stock-movement.repository'
import type { ProductRepository, Tx } from '../repositories/product.repository'
import type { StockAdjustmentResult, StockDirection } from '../types/domain'

export interface StockAdjustmentInput {
  type: MovementType
  quantity: number
  supplierId?: number
  clientId?: number
  note?: string
}

export interface StockServiceDeps {
  productRepository: ProductRepository
  movementRepository: StockMovementRepository
  runTransaction: <T>(fn: (tx: Tx) => Promise<T>) => Promise<T>
}

// Tipos de movimiento admitidos por dirección.
export const IN_TYPES: MovementType[] = ['BUY', 'MANUAL_ADJUST']
export const OUT_TYPES: MovementType[] = [
  'SALE',
  'BREAKAGE',
  'EXPIRY',
  'DONATION',
  'INTERNAL_CONSUMPTION',
  'MANUAL_ADJUST',
]

/**
 * Servicio centralizado de stock. Es el ÚNICO lugar que modifica el stock.
 * Garantías:
 *  - cada cambio se registra como StockMovement en la misma transacción;
 *  - una salida nunca deja el stock < 0 (guard atómico + check en DB);
 *  - tolera concurrencia (updateMany con guard `stock >= quantity`).
 */
export class StockService {
  constructor(private readonly deps: StockServiceDeps) {}

  async stockIn(productId: number, input: StockAdjustmentInput): Promise<StockAdjustmentResult> {
    return this.adjust(productId, 'in', input)
  }

  async stockOut(productId: number, input: StockAdjustmentInput): Promise<StockAdjustmentResult> {
    return this.adjust(productId, 'out', input)
  }

  private async adjust(
    productId: number,
    direction: StockDirection,
    input: StockAdjustmentInput,
  ): Promise<StockAdjustmentResult> {
    const allowed = direction === 'in' ? IN_TYPES : OUT_TYPES
    if (!allowed.includes(input.type)) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, `Tipo de movimiento no permitido para ${direction}`)
    }
    if (input.quantity <= 0) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'La cantidad debe ser mayor a 0')
    }

    return this.deps.runTransaction(async (tx) => {
      const product = await this.deps.productRepository.readForUpdate(tx, productId)
      if (!product) {
        throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Producto no encontrado')
      }
      if (product.status === 'INACTIVE') {
        throw new AppError(409, ERROR_CODES.CONFLICT, 'No se puede modificar el stock de un producto inactivo')
      }

      const previousStock = product.stock
      let resultingStock = previousStock

      if (direction === 'in') {
        const ok = await this.deps.productRepository.incrementStock(tx, productId, input.quantity)
        if (!ok) {
          throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Producto no encontrado')
        }
        resultingStock = previousStock + input.quantity
      } else {
        if (previousStock < input.quantity) {
          throw new AppError(409, ERROR_CODES.INSUFFICIENT_STOCK, 'No hay stock suficiente para realizar este movimiento.')
        }
        // Guard atómico anti race condition: si otro request ya consumió stock,
        // count = 0 y se rechaza la salida sin dejar stock negativo.
        const ok = await this.deps.productRepository.decrementStock(tx, productId, input.quantity)
        if (!ok) {
          throw new AppError(409, ERROR_CODES.INSUFFICIENT_STOCK, 'No hay stock suficiente para realizar este movimiento.')
        }
        resultingStock = previousStock - input.quantity
      }

      const movement = await this.deps.movementRepository.create(tx, {
        productId,
        type: input.type,
        quantity: input.quantity,
        stockBefore: previousStock,
        stockAfter: resultingStock,
        supplierId: input.supplierId ?? null,
        clientId: input.clientId ?? null,
        note: input.note ?? null,
      })

      return {
        product: { id: product.id, name: product.name, stock: resultingStock, stockMin: product.stockMin ?? 0 },
        movement: {
          id: movement.id,
          type: movement.type,
          quantity: movement.quantity,
          previousStock: movement.stockBefore,
          resultingStock: movement.stockAfter,
          note: movement.note,
          createdAt: movement.createdAt,
        },
      }
    })
  }
}