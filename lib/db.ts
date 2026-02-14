// lib/db.ts - Prisma client for server-side only
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

const dbOptions: { datasources?: { db: { url: string } } } = {};

// Next.js loads env files in this order: .env.local, .env.[NODE_ENV], .env
// So .env.local values should override .env values
// But when running in Node (not Next.js), we need to handle this manually
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (databaseUrl) {
  dbOptions.datasources = {
    db: {
      url: databaseUrl,
    },
  };
}

export const db = globalForPrisma.prisma || new PrismaClient(dbOptions);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
