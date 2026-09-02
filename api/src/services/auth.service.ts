import { AppError } from '../utils/app-error'
import { ERROR_CODES } from '../constants/errors'
import { hashPassword, signToken, verifyPassword } from '../utils/crypto'
import type { LoginInput } from '../schemas/auth'

export interface AuthConfig {
  email: string
  password: string
  secret: string
  tokenTtlSeconds: number
}

export interface LoginResult {
  token: string
  expiresAt: string
  email: string
}

// Hash cached del ADMIN_PASSWORD para comparaciones en tiempo constante sin
// re-hashear en cada login.
let cachedPasswordHash: string | null = null

/**
 * Autenticación de un único dueño (sin multiusuario).
 * `email`/`password` vienen de variables de entorno; los tokens son HMAC firmados
 * con `AUTH_SECRET` y expiran (AUTH_TOKEN_TTL_SECONDS, 12h por defecto).
 */
export class AuthService {
  constructor(private readonly config: AuthConfig) {}

  async login(input: LoginInput): Promise<LoginResult> {
    if (!this.config.email || !this.config.password || !this.config.secret) {
      throw new AppError(500, ERROR_CODES.INTERNAL_ERROR, 'La autenticación no está configurada en el servidor')
    }
    if (!isSameEmail(input.email, this.config.email)) {
      throw new AppError(401, ERROR_CODES.INVALID_CREDENTIALS, 'Credenciales inválidas')
    }

    cachedPasswordHash ??= await hashPassword(this.config.password)
    const valid = await verifyPassword(input.password, cachedPasswordHash)
    if (!valid) {
      throw new AppError(401, ERROR_CODES.INVALID_CREDENTIALS, 'Credenciales inválidas')
    }

    const exp = Math.floor(Date.now() / 1000) + this.config.tokenTtlSeconds
    const token = signToken({ sub: this.config.email, exp }, this.config.secret)
    return {
      token,
      expiresAt: new Date(exp * 1000).toISOString(),
      email: this.config.email,
    }
  }
}

function isSameEmail(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}