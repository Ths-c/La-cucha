import { AppError } from '../utils/app-error'
import { ERROR_CODES } from '../constants/errors'
import { parsePagination, buildPaginated, type Paginated } from '../utils/pagination'
import type { Client, MovementType } from '@prisma/client'
import type { ClientRepository } from '../repositories/client.repository'
import type { StockMovementRepository } from '../repositories/stock-movement.repository'
import type { CreateClientInput, ClientListQuery, UpdateClientInput } from '../schemas/client'

export interface ClientServiceDeps {
  clientRepository: ClientRepository
  movementRepository: StockMovementRepository
}

export class ClientService {
  constructor(private readonly deps: ClientServiceDeps) {}

  async list(query: ClientListQuery): Promise<Paginated<Client>> {
    const pagination = parsePagination(String(query.page ?? ''), String(query.limit ?? ''))
    const filters = { search: query.search, status: query.status }
    const [items, total] = await Promise.all([
      this.deps.clientRepository.list({ ...filters, skip: pagination.skip, limit: pagination.limit }),
      this.deps.clientRepository.count(filters),
    ])
    return buildPaginated(items, total, pagination)
  }

  async trash(): Promise<Paginated<Client>> {
    return this.list({ status: 'INACTIVE' })
  }

  async get(id: number): Promise<Client> {
    const client = await this.deps.clientRepository.findById(id)
    if (!client) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Cliente no encontrado')
    }
    return client
  }

  async create(input: CreateClientInput): Promise<Client> {
    return this.deps.clientRepository.create({
      name: input.name,
      contact: input.contact ?? null,
      notes: input.notes ?? null,
      status: 'ACTIVE',
    })
  }

  async update(id: number, input: UpdateClientInput): Promise<Client> {
    await this.get(id)
    const updated = await this.deps.clientRepository.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.contact !== undefined ? { contact: input.contact } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    })
    if (!updated) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Cliente no encontrado')
    }
    return updated
  }

  // Desactiva (papelera). El historial de compras (StockMovement) se conserva.
  async deactivate(id: number): Promise<Client> {
    await this.get(id)
    const updated = await this.deps.clientRepository.update(id, { status: 'INACTIVE' })
    if (!updated) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Cliente no encontrado')
    return updated
  }

  async restore(id: number): Promise<Client> {
    await this.get(id)
    const updated = await this.deps.clientRepository.update(id, { status: 'ACTIVE' })
    if (!updated) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Cliente no encontrado')
    return updated
  }

  // Historial de compras: movimientos de tipo SALE vinculados al cliente.
  async purchases(
    clientId: number,
    params: { page?: number | string; limit?: number | string },
  ): Promise<Paginated<import('@prisma/client').StockMovement>> {
    await this.get(clientId)
    const pagination = parsePagination(String(params.page ?? ''), String(params.limit ?? ''))
    const type = 'SALE' as MovementType
    const [items, total] = await Promise.all([
      this.deps.movementRepository.listByClient(
        clientId,
        type,
        pagination.skip,
        pagination.limit,
      ),
      this.deps.movementRepository.countByClient(clientId, type),
    ])
    return buildPaginated(items, total, pagination)
  }
}
