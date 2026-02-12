// lib/db.ts - Fixed for Vercel deployment
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global || (typeof window !== 'undefined' ? window : {})

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: globalForPrisma.env === 'development' ? ['query', 'error', 'warn'] : ['query', 'error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
