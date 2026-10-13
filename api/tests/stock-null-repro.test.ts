import { describe, expect, it } from 'vitest'
import { stockInSchema, stockOutSchema } from '../src/schemas/stock-movement'
import { createProductSchema } from '../src/schemas/product'

describe('repro: POST /products/:id/stock/in con null', () => {
  it('acepta body sin proveedor', () => {
    expect(() => stockInSchema.parse({ type: 'BUY', quantity: 1 })).not.toThrow()
  })
  it('acepta supplierId: null (lo que mandaba el front)', () => {
    expect(stockInSchema.parse({ type: 'BUY', quantity: 1, supplierId: null })).toMatchObject({
      type: 'BUY',
      quantity: 1,
    })
  })
  it('acepta note: null y note: ""', () => {
    expect(stockInSchema.parse({ type: 'BUY', quantity: 2, note: null }).note).toBeUndefined()
    expect(stockInSchema.parse({ type: 'BUY', quantity: 2, note: '' }).note).toBeUndefined()
  })
  it('acepta stockOut SALE con clientId: null y priceType', () => {
    expect(stockOutSchema.parse({ type: 'SALE', quantity: 1, clientId: null, priceType: 'KILO' })).toMatchObject({
      type: 'SALE',
    })
  })
  it('acepta createProduct con supplierId: null y al menos un precio', () => {
    expect(
      createProductSchema.parse({ name: 'X', categoryId: 1, supplierId: null, price: 1000 }),
    ).toMatchObject({ name: 'X' })
  })
})
