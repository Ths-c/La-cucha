import 'dotenv/config'

const stringOr = (name: string, fallback: string): string => process.env[name] ?? fallback

export const config = {
  env: stringOr('NODE_ENV', 'development'),
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: stringOr('CORS_ORIGIN', 'http://localhost:5173'),
  // Base de datos PostgreSQL (Supabase). DIRECT_URL se usa para migraciones/seed
  // (conexión directa) y DATABASE_URL con el pooler.
  databaseUrl: stringOr('DATABASE_URL', ''),
  directUrl: stringOr('DIRECT_URL', ''),
  // Zona horaria centralizada (Argentina por defecto). No hardcodear en el código.
  timezone: stringOr('TIMEZONE', 'America/Argentina/Buenos_Aires'),
  supabase: {
    url: stringOr('SUPABASE_URL', ''),
    anonKey: stringOr('SUPABASE_ANON_KEY', ''),
    serviceRoleKey: stringOr('SUPABASE_SERVICE_ROLE_KEY', ''),
  },
  // Auth de un solo dueño. `AUTH_SECRET` genera tokens HMAC; `ADMIN_EMAIL` /
  // `ADMIN_PASSWORD` validan el login. En producción estos deben estar seteados.
  auth: {
    email: stringOr('ADMIN_EMAIL', ''),
    password: stringOr('ADMIN_PASSWORD', ''),
    secret: stringOr('AUTH_SECRET', ''),
    tokenTtlSeconds: Number(process.env.AUTH_TOKEN_TTL_SECONDS ?? 60 * 60 * 12),
  },
} as const