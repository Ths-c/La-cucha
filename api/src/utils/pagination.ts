export interface Pagination {
  page: number
  limit: number
  skip: number
}

export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 20
export const MAX_LIMIT = 100

// Parsea y normaliza page/limit con límites razonables.
export function parsePagination(pageValue: unknown, limitValue: unknown): Pagination {
  const page = toPositiveInt(pageValue, DEFAULT_PAGE)
  const limit = toPositiveInt(limitValue, DEFAULT_LIMIT)
  return {
    page,
    limit: Math.min(limit, MAX_LIMIT),
    skip: (page - 1) * Math.min(limit, MAX_LIMIT),
  }
}

function toPositiveInt(value: unknown, fallback: number): number {
  if (typeof value !== 'string') return fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed < 1) return fallback
  return parsed
}

// Contrato de una respuesta paginada.
export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function buildPaginated<T>(items: T[], total: number, pagination: Pagination): Paginated<T> {
  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.max(1, Math.ceil(total / pagination.limit)),
  }
}