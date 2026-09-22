import { randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';

const MAX_ORDER_ID_ATTEMPTS = 2;

export function generateOrderId(now = new Date()) {
  const date = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
  ].join('');
  const suffix = randomBytes(4).readUInt32BE(0).toString(36).padStart(7, '0').slice(-6).toUpperCase();
  return `ORD-${date}-${suffix}`;
}

export function isOrderIdCollision(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') return false;
  const target = error.meta?.target;
  return Array.isArray(target)
    ? target.some((field) => String(field).includes('orderId'))
    : String(target || '').includes('orderId');
}

export async function createWithOrderIdRetry<T>(create: (orderId: string) => Promise<T>) {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ORDER_ID_ATTEMPTS; attempt += 1) {
    try {
      return await create(generateOrderId());
    } catch (error) {
      lastError = error;
      if (!isOrderIdCollision(error) || attempt === MAX_ORDER_ID_ATTEMPTS - 1) throw error;
    }
  }
  throw lastError;
}
