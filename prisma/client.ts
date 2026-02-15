// Prisma client initialization
import { PrismaClient } from '@prisma/client';

const prismaClient = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Create a singleton Prisma client instance
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma || prismaClient;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
