import type { ProductStatus, ProductUnit, SupplierStatus } from '@/types/domain'

/** Combina clases condicionalmente y descarta falsy. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export const STATUS_LABELS: Record<ProductStatus | SupplierStatus, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
}

export const MOVEMENT_LABELS: Record<string, string> = {
  BUY: 'Compra',
  SALE: 'Venta',
  BREAKAGE: 'Rotura',
  EXPIRY: 'Vencimiento',
  DONATION: 'Donación',
  INTERNAL_CONSUMPTION: 'Consumo interno',
  MANUAL_ADJUST: 'Ajuste manual',
}

export const MOVEMENT_SIGN: Record<string, string | null> = {
  BUY: '+',
  SALE: '-',
  BREAKAGE: '-',
  EXPIRY: '-',
  DONATION: '-',
  INTERNAL_CONSUMPTION: '-',
  MANUAL_ADJUST: null,
}

export const UNIT_LABELS: Record<ProductUnit, string> = {
  UNITS: 'Unidades',
  KG: 'Kilogramos',
}

export const UNIT_SHORT: Record<ProductUnit, string> = {
  UNITS: 'u.',
  KG: 'kg',
}

/** Formatea una cantidad según la unidad (hasta 3 decimales en KG). */
export function formatQuantity(value: number, unit: ProductUnit): string {
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: unit === 'KG' ? 3 : 0,
  }).format(value)
  return `${formatted} ${UNIT_SHORT[unit]}`
}

/** Precio en pesos argentinos. */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(value)
}

/** Etiqueta de precio según unidad: por unidad o por kilogramo. */
export function pricePerLabel(unit: ProductUnit): string {
  return unit === 'KG' ? 'por kilogramo' : 'por unidad'
}

export function isOnPromo(price: number | null, promoPrice: number | null): promoPrice is number {
  return price != null && promoPrice != null && promoPrice < price
}