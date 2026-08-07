import { getToken, emitUnauthorized } from '@/services/token'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: unknown }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  query?: object
}

function buildQuery(query?: object): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

/** Cliente HTTP tipado. Devuelve `data` directo o lanza `ApiError`. */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const init: RequestInit = {
    method: options.method ?? 'GET',
    headers,
  }

  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body)
  }

  let res: Response
  try {
    const url = `${API_URL}${path}${buildQuery(options.query)}`
    res = await fetch(url, init)
  } catch {
    throw new ApiError('No se pudo conectar con el servidor.', 0, 'NETWORK')
  }

  if (res.status === 204) return undefined as T

  let json: ApiErrorBody | { data: T } | null = null
  try {
    json = (await res.json()) as { data: T }
  } catch {
    json = null
  }

  if (!res.ok) {
    // Token inválido o expirado: cerramos sesión y dejamos que la app redirija.
    if (res.status === 401) emitUnauthorized()
    const err = (json as ApiErrorBody | null)?.error
    throw new ApiError(
      err?.message ?? 'Ocurrió un error inesperado.',
      res.status,
      err?.code ?? 'UNKNOWN',
      err?.details,
    )
  }

  return (json as { data: T } | null)?.data as T
}