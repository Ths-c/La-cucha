import type { OrderInput } from '../types/domain'
import { buildWhatsAppUrl, normalizeWhatsApp } from '../utils/phone'

// Construye el mensaje profesional de pedido a un proveedor.
// Función pura: recibe datos estructurados y devuelve el texto.
export function buildSupplierOrderMessage(input: OrderInput): string {
  const lines: string[] = []
  lines.push(`Hola, quisiera realizar el siguiente pedido:`)
  lines.push('')
  for (const item of input.items) {
    lines.push(`• ${item.name} x${item.quantity}`)
  }
  if (input.note && input.note.trim().length > 0) {
    lines.push('')
    lines.push('Observaciones:')
    lines.push(input.note.trim())
  }
  lines.push('')
  lines.push('Muchas gracias.')
  return lines.join('\n')
}

// Genera una URL wa.me a partir de un número normalizado y un mensaje.
export function buildOrderWhatsAppUrl(whatsappNumber: string, message: string): string {
  return buildWhatsAppUrl(normalizeWhatsApp(whatsappNumber), message)
}