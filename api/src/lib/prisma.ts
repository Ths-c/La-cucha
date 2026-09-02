import { PrismaClient } from '@prisma/client'

// Instancia única de PrismaClient (evita múltiples conexiones en dev).
export const prisma = new PrismaClient()