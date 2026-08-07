import { describe, it, expect, vi } from 'vitest'
import { OrderService } from '../src/services/order.service'
import { AppError } from '../src/utils/app-error'
import type { SupplierRepository } from '../src/repositories/supplier.repository'
import type { SupplierProductRepository } from '../src/repositories/supplier-product.repository'

function setup() {
  const supplierRepository = {
    findById: vi.fn(async (id: number) =>
      id === 1 ? { id: 1, name: 'Purina', whatsappNumber: '+5491155556677', status: 'ACTIVE' } : null,
    ),
  } as unknown as SupplierRepository

  const supplierProductRepository = {
    findByIdsForSupplier: vi.fn(async (_supplierId: number, ids: number[]) =>
      ids.map((id) => ({ id, name: `Producto ${id}`, status: 'ACTIVE' })),
    ),
  } as unknown as SupplierProductRepository

  const service = new OrderService({ supplierRepository, supplierProductRepository })
  return { service, supplierRepository, supplierProductRepository }
}

describe('OrderService.preview', () => {
  it('resuelve los ítems y arma el mensaje + URL de WhatsApp', async () => {
    const { service } = setup()
    const result = await service.preview({
      supplierId: 1,
      items: [{ supplierProductId: 7, quantity: 2 }],
    })

    expect(result.supplierName).toBe('Purina')
    expect(result.items).toEqual([{ name: 'Producto 7', quantity: 2 }])
    expect(result.message).toContain('• Producto 7 x2')
    expect(result.whatsappUrl).toMatch(/^https:\/\/wa\.me\/\+5491155556677\?text=/)
  })

  it('lanza 404 si el proveedor no existe', async () => {
    const { service } = setup()
    await expect(
      service.preview({ supplierId: 999, items: [{ supplierProductId: 1, quantity: 1 }] }),
    ).rejects.toBeInstanceOf(AppError)
  })
})