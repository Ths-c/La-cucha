import 'dotenv/config'

const stringOr = (name: string, fallback: string): string => process.env[name] ?? fallback

export const config = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: stringOr('CORS_ORIGIN', 'http://localhost:5173'),
  supabase: {
    url: stringOr('SUPABASE_URL', ''),
    anonKey: stringOr('SUPABASE_ANON_KEY', ''),
    serviceRoleKey: stringOr('SUPABASE_SERVICE_ROLE_KEY', ''),
  },
} as const