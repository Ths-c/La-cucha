import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// El cliente usa la ANON key (seguro para el frontend).
// Los secretos (service role) solo viven en el backend.
export const supabase = url && anonKey ? createClient(url, anonKey) : null