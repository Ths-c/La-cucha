import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email('Email inválido').max(254),
  password: z.string().min(1, 'La contraseña es obligatoria').max(256),
})
export type LoginInput = z.infer<typeof loginSchema>