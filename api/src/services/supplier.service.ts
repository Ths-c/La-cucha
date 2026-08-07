import { AppError } from '../utils/app-error'
import { ERROR_CODES } from '../constants/errors'
import { parsePagination, buildPaginated, type Paginated } from '../utils/pagination'
import { normalizeWhatsApp } from '../utils/phone'
import type { Supplier } from '@prisma/client'
import type { SupplierRepository } from '../repositories/supplier.repository'
import type { CreateSupplierInput, SupplierListQuery, UpdateSupplierInput } from '../schemas/supplier'

export interface SupplierServiceDeps {
  supplierRepository: SupplierRepository
}

export class SupplierService {
  constructor(private readonly deps: SupplierServiceDeps) {}

  async list(query: SupplierListQuery): Promise<Paginated<Supplier>> {
    const pagination = parsePagination(String(query.page ?? ''), String(query.limit ?? ''))
    const filters = { search: query.search, status: query.status }
    const [items, total] = await Promise.all([
      this.deps.supplierRepository.list({ ...filters, skip: pagination.skip, limit: pagination.limit }),
      this.deps.supplierRepository.count(filters),
    ])
    return buildPaginated(items, total, pagination)
  }

  async trash(): Promise<Paginated<Supplier>> {
    return this.list({ status: 'INACTIVE' })
  }

  async get(id: number): Promise<Supplier> {
    const supplier = await this.deps.supplierRepository.findById(id)
    if (!supplier) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Proveedor no encontrado')
    }
    return supplier
  }

  async create(input: CreateSupplierInput): Promise<Supplier> {
    const whatsappNumber = this.normalize(input.whatsappNumber)
    await this.assertWhatsappUnique(whatsappNumber, undefined)
    return this.deps.supplierRepository.create({
      name: input.name,
      whatsappNumber,
      notes: input.notes ?? null,
      status: 'ACTIVE',
    })
  }

  async update(id: number, input: UpdateSupplierInput): Promise<Supplier> {
    const existing = await this.get(id)
    const whatsappNumber =
      input.whatsappNumber !== undefined ? this.normalize(input.whatsappNumber) : existing.whatsappNumber
    if (input.whatsappNumber !== undefined) {
      await this.assertWhatsappUnique(whatsappNumber, id)
    }
    const updated = await this.deps.supplierRepository.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.whatsappNumber !== undefined ? { whatsappNumber } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    })
    if (!updated) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Proveedor no encontrado')
    }
    return updated
  }

  // Desactiva (papelera). Los productos/movimientos conservan la referencia
  // histórica; no se borra nada.
  async deactivate(id: number): Promise<Supplier> {
    await this.get(id)
    const updated = await this.deps.supplierRepository.update(id, { status: 'INACTIVE' })
    if (!updated) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Proveedor no encontrado')
    return updated
  }

  async restore(id: number): Promise<Supplier> {
    await this.get(id)
    const updated = await this.deps.supplierRepository.update(id, { status: 'ACTIVE' })
    if (!updated) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Proveedor no encontrado')
    return updated
  }

  private normalize(whatsappNumber: string): string {
    try {
      return normalizeWhatsApp(whatsappNumber)
    } catch {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Número de WhatsApp inválido')
    }
  }

  private async assertWhatsappUnique(whatsappNumber: string, excludeId?: number): Promise<void> {
    const existing = await this.deps.supplierRepository.findByWhatsappNumber(whatsappNumber)
    if (existing && existing.id !== excludeId) {
      throw new AppError(409, ERROR_CODES.SUPPLIER_WHATSAPP_EXISTS, 'Ya existe un proveedor con ese número de WhatsApp')
    }
  }
}