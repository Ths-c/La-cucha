import type { ProductStatus, SupplierStatus } from '@/types/domain'

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