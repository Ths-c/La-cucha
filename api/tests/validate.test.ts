import { describe, it, expect, vi } from 'vitest'
import { validate } from '../src/middleware/validate'
import { createProductSchema } from '../src/schemas/product'
import type { Request, Response, NextFunction } from 'express'

function mockRes() {
  return { locals: {} } as Response
}

describe('validate middleware', () => {
  it('parsea el body y lo guarda en res.locals.validated', () => {
    const handler = validate({ body: createProductSchema })
    const res = mockRes()
    const next = vi.fn()

    handler(
      { body: { name: 'Arena', categoryId: 1, stock: '5' }, params: {}, query: {} } as unknown as Request,
      res,
      next,
    )

    expect(next).toHaveBeenCalledWith()
    expect(res.locals.validated?.body).toEqual({ name: 'Arena', categoryId: 1, stock: 5, stockMin: 0, unit: 'UNITS' })
  })

  it('pasa el error a next cuando la validación falla', () => {
    const handler = validate({ body: createProductSchema })
    const res = mockRes()
    const next = vi.fn()

    handler({ body: { name: '' }, params: {}, query: {} } as unknown as Request, res, next)
    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })

  it('rechaza claves extra (strict)', () => {
    const handler = validate({ body: createProductSchema })
    const res = mockRes()
    const next = vi.fn()
    handler({ body: { name: 'X', categoryId: 1, hacker: true }, params: {}, query: {} } as unknown as Request, res, next)
    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })

  it('acepta KG con decimales, precio y oferta', () => {
    const handler = validate({ body: createProductSchema })
    const res = mockRes()
    const next = vi.fn()

    handler(
      { body: { name: 'Suelto', categoryId: 1, stock: '2.5', unit: 'KG', price: '8500', promoPrice: 7999 }, params: {}, query: {} } as unknown as Request,
      res,
      next,
    )

    expect(next).toHaveBeenCalledWith()
    expect(res.locals.validated?.body).toEqual(
      expect.objectContaining({ stock: 2.5, unit: 'KG', price: 8500, promoPrice: 7999 }),
    )
  })

  it('rechaza oferta mayor al precio normal', () => {
    const handler = validate({ body: createProductSchema })
    const res = mockRes()
    const next = vi.fn()
    handler(
      { body: { name: 'X', categoryId: 1, price: 100, promoPrice: 150 }, params: {}, query: {} } as unknown as Request,
      res,
      next,
    )
    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })

  it('rechaza más de 3 decimales en stock', () => {
    const handler = validate({ body: createProductSchema })
    const res = mockRes()
    const next = vi.fn()
    handler({ body: { name: 'X', categoryId: 1, stock: 1.2345 }, params: {}, query: {} } as unknown as Request, res, next)
    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })
})