import { describe, it, expect } from 'vitest'
import { normalizeWhatsApp, buildWhatsAppUrl } from '../src/utils/phone'

describe('normalizeWhatsApp', () => {
  it('normaliza un número con separadores visuales', () => {
    expect(normalizeWhatsApp('+54 9 11 5555-6677')).toBe('+5491155556677')
  })

  it('agrega el prefijo + si falta', () => {
    expect(normalizeWhatsApp('5491155556677')).toBe('+5491155556677')
  })

  it('lanza error si el número es inválido', () => {
    expect(() => normalizeWhatsApp('123')).toThrow('WhatsApp')
    expect(() => normalizeWhatsApp('')).toThrow('WhatsApp')
  })
})

describe('buildWhatsAppUrl', () => {
  it('construye la URL wa.me con mensaje codificado', () => {
    const url = buildWhatsAppUrl('+5491155556677', 'Hola, pedido')
    expect(url).toBe(`https://wa.me/+5491155556677?text=${encodeURIComponent('Hola, pedido')}`)
  })
})