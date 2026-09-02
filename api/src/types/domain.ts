// Tipos de dominio compartidos (independientes de Prisma/exigidos por el negocio).

import type { MovementType } from '@prisma/client'

// Dirección de un movimiento de stock.
export type StockDirection = 'in' | 'out'

// Resultado normalizado de un ajuste de stock (producto + movimiento creado).
export interface StockAdjustmentResult {
  product: {
    id: number
    name: string
    stock: number
    stockMin: number
  }
  movement: {
    id: number
    type: MovementType
    quantity: number
    previousStock: number
    resultingStock: number
    note: string | null
    createdAt: Date
  }
}

// Item del carrito de pedido a un proveedor.
export interface OrderItemInput {
  supplierProductId: number
  quantity: number
}

// Datos con los que se construye el mensaje de WhatsApp.
export interface OrderInput {
  supplier: {
    id: number
    name: string
    whatsappNumber: string
  }
  items: {
    name: string
    quantity: number
  }[]
  note?: string
}

// Contrato de salida del preview de pedido.
export interface OrderPreview {
  supplierId: number
  supplierName: string
  whatsappNumber: string
  items: { name: string; quantity: number }[]
  note?: string
  message: string
  whatsappUrl: string
}

// Formato de respuesta de error uniforme.
export interface ApiErrorBody {
  error: {
    code: string
    message: string
    details?: unknown
  }
}