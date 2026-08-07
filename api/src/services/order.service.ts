import { AppError } from '../utils/app-error'
import { ERROR_CODES } from '../constants/errors'
import type { OrderPreview, OrderItemInput } from '../types/domain'
import type { SupplierRepository } from '../repositories/supplier.repository'
import type { SupplierProductRepository } from '../repositories/supplier-product.repository'
import type { CreateOrderPreviewInput } from '../schemas/order'
import { buildSupplierOrderMessage, buildOrderWhatsAppUrl } from './whatsapp.service'

export interface OrderServiceDeps {
  supplierRepository: SupplierRepository
  supplierProductRepository: SupplierProductRepository
}

export class OrderService {
  constructor(private readonly deps: OrderServiceDeps) {}

  // Valida el carrito y devuelve el mensaje + URL de WhatsApp listos.
  // No persiste nada: el carrito es estado temporal del frontend.
  async preview(input: CreateOrderPreviewInput): Promise<OrderPreview> {
    const supplier = await this.deps.supplierRepository.findById(input.supplierId)
    if (!supplier) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Proveedor no encontrado')
    }
    if (supplier.status === 'INACTIVE') {
      throw new AppError(409, ERROR_CODES.CONFLICT, 'El proveedor está inactivo')
    }

    const items = await this.resolveItems(supplier.id, input.items)

    const message = buildSupplierOrderMessage({
      supplier: { id: supplier.id, name: supplier.name, whatsappNumber: supplier.whatsappNumber },
      items,
      note: input.note,
    })

    return {
      supplierId: supplier.id,
      supplierName: supplier.name,
      whatsappNumber: supplier.whatsappNumber,
      items,
      note: input.note,
      message,
      whatsappUrl: buildOrderWhatsAppUrl(supplier.whatsappNumber, message),
    }
  }

  private async resolveItems(
    supplierId: number,
    rawItems: OrderItemInput[],
  ): Promise<{ name: string; quantity: number }[]> {
    const ids = rawItems.map((i) => i.supplierProductId)
    const found = await this.deps.supplierProductRepository.findByIdsForSupplier(supplierId, ids)

    const byId = new Map(found.map((p) => [p.id, p]))
    const resolved: { name: string; quantity: number }[] = []
    for (const item of rawItems) {
      const product = byId.get(item.supplierProductId)
      if (!product) {
        throw new AppError(
          400,
          ERROR_CODES.INVALID_RELATION,
          `El producto ${item.supplierProductId} no pertenece al proveedor`,
        )
      }
      if (product.status === 'INACTIVE') {
        throw new AppError(409, ERROR_CODES.CONFLICT, `El producto "${product.name}" está inactivo`)
      }
      resolved.push({ name: product.name, quantity: item.quantity })
    }
    return resolved
  }
}