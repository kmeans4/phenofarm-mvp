// lib/db.ts - Prisma client for server-side only
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

const dbOptions: { datasources?: { db: { url: string } } } = {};

if (process.env.DATABASE_URL) {
  dbOptions.datasources = {
    db: {
      url: process.env.DATABASE_URL,
    },
  };
}

export const db = globalForPrisma.prisma || new PrismaClient(dbOptions);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
