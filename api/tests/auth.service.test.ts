import { describe, it, expect } from 'vitest'
import { AuthService } from '../src/services/auth.service'
import { signToken, verifyToken } from '../src/utils/crypto'
import { AppError } from '../src/utils/app-error'

const config = {
  email: 'admin@test.com',
  password: 's3cr3t-password',
  secret: 'test-secret-1234567890',
  tokenTtlSeconds: 3600,
}

describe('AuthService.login', () => {
  it('emite un token firmado y válido con credenciales correctas', async () => {
    const service = new AuthService(config)
    const result = await service.login({ email: 'ADMIN@test.com', password: config.password })

    expect(result.token).toBeTruthy()
    expect(result.email).toBe('admin@test.com')
    const payload = verifyToken(result.token, config.secret)
    expect(payload?.sub).toBe('admin@test.com')
  })

  it('rechaza contraseña incorrecta', async () => {
    const service = new AuthService(config)
    await expect(
      service.login({ email: config.email, password: 'incorrecta' }),
    ).rejects.toBeInstanceOf(AppError)
  })

  it('rechaza email incorrecto', async () => {
    const service = new AuthService(config)
    await expect(
      service.login({ email: 'otro@test.com', password: config.password }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
  })

  it('no se autentica si el servidor no está configurado', async () => {
    const service = new AuthService({ email: '', password: '', secret: '', tokenTtlSeconds: 3600 })
    await expect(
      service.login({ email: 'x@test.com', password: 'y' }),
    ).rejects.toMatchObject({ status: 500 })
  })
})

describe('signToken / verifyToken', () => {
  const now = Math.floor(Date.now() / 1000)

  it('verifica un token vigente', () => {
    const token = signToken({ sub: config.email, exp: now + 3600 }, config.secret)
    expect(verifyToken(token, config.secret)?.sub).toBe(config.email)
  })

  it('rechaza tokens vencidos', () => {
    const token = signToken({ sub: config.email, exp: now - 10 }, config.secret)
    expect(verifyToken(token, config.secret)).toBeNull()
  })

  it('rechaza tokens con la firma alterada', () => {
    const token = signToken({ sub: config.email, exp: now + 3600 }, config.secret)
    const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a')
    expect(verifyToken(tampered, config.secret)).toBeNull()
  })

  it('rechaza tokens firmados con otro secreto', () => {
    const token = signToken({ sub: config.email, exp: now + 3600 }, 'otro-secreto')
    expect(verifyToken(token, config.secret)).toBeNull()
  })
})