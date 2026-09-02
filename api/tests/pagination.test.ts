import { describe, it, expect } from 'vitest'
import { parsePagination, buildPaginated } from '../src/utils/pagination'

describe('parsePagination', () => {
  it('usa valores por defecto cuando no recibe nada', () => {
    const p = parsePagination('', '')
    expect(p).toEqual({ page: 1, limit: 20, skip: 0 })
  })

  it('calcula skip a partir de page y limit', () => {
    const p = parsePagination('3', '10')
    expect(p.page).toBe(3)
    expect(p.skip).toBe(20)
  })

  it('acota el limit al máximo permitido', () => {
    expect(parsePagination('1', '500').limit).toBe(100)
  })

  it('descarta valores inválidos y vuelve al default', () => {
    expect(parsePagination('abc', '-5').page).toBe(1)
    expect(parsePagination('0', '-5').page).toBe(1)
  })
})

describe('buildPaginated', () => {
  it('construye el envoltorio paginado', () => {
    const p = buildPaginated([{ id: 1 }], 25, { page: 2, limit: 10, skip: 10 })
    expect(p).toEqual({ items: [{ id: 1 }], total: 25, page: 2, limit: 10, totalPages: 3 })
  })

  it('nunca devuelve totalPages menor a 1', () => {
    const p = buildPaginated([], 0, { page: 1, limit: 20, skip: 0 })
    expect(p.totalPages).toBe(1)
  })
})