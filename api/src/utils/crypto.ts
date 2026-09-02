import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)

// ── Contraseñas (scrypt, sin dependencias externas) ────────────────────────
// Formato almacenado: `salt:hash` (hex). El salt es aleatorio por contraseña.

const PASSWORD_SALT_BYTES = 16

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(PASSWORD_SALT_BYTES).toString('hex')
  const hash = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${hash.toString('hex')}`
}

// Compara una contraseña contra un hash `salt:hash` en tiempo constante.
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(':')
  if (!salt || !hashHex) return false
  const expected = Buffer.from(hashHex, 'hex')
  const actual = (await scryptAsync(password, salt, 64)) as Buffer
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}

// ── Tokens HMAC (firmados, con expiración) ─────────────────────────────────

export interface SignedTokenPayload {
  sub: string
  exp: number
}

const HASH_ALGO = 'sha256'

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url')
}

// Firma un token `payload` con un secreto. No expone datos sensibles.
export function signToken(payload: SignedTokenPayload, secret: string): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = b64url(JSON.stringify(payload))
  const signature = createHmac(HASH_ALGO, secret).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${signature}`
}

// Verifica firma y expiración. Devuelve el payload o null si es inválido/vencido.
export function verifyToken(token: string, secret: string): SignedTokenPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, signature] = parts
  const expected = createHmac(HASH_ALGO, secret).update(`${header}.${body}`).digest()
  const actual = Buffer.from(signature, 'base64url')
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Partial<SignedTokenPayload>
    if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') return null
    if (payload.exp < Date.now() / 1000) return null
    return { sub: payload.sub, exp: payload.exp }
  } catch {
    return null
  }
}