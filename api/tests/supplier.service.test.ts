import { describe, it, expect, vi } from 'vitest'
import { SupplierService } from '../src/services/supplier.service'
import { AppError } from '../src/utils/app-error'
import type { SupplierRepository } from '../src/repositories/supplier.repository'

function setup() {
  const supplierRepository = {
    findByWhatsappNumber: vi.fn(async () => null),
    create: vi.fn(async (data) => ({ id: 1, ...data })),
  } as unknown as SupplierRepository
  const service = new SupplierService({ supplierRepository })
  return { service, supplierRepository }
}

describe('SupplierService.create', () => {
  it('normaliza el número de WhatsApp antes de persistir', async () => {
    const { service, supplierRepository } = setup()
    await service.create({ name: 'Purina', whatsappNumber: '+54 9 11 5555-6677' })
    expect(supplierRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      whatsappNumber: '+5491155556677',
    }))
  })

  it('lanza 409 si el WhatsApp ya existe', async () => {
    const { service, supplierRepository } = setup()
    supplierRepository.findByWhatsappNumber.mockResolvedValueOnce({ id: 99 } as never)
    await expect(service.create({ name: 'Otro', whatsappNumber: '+5491155556677' })).rejects.toMatchObject({
      code: 'SUPPLIER_WHATSAPP_EXISTS',
    })
  })

  it('lanza error si el número es inválido', async () => {
    const { service } = setup()
    await expect(service.create({ name: 'X', whatsappNumber: '123' })).rejects.toBeInstanceOf(AppError)
  })
})