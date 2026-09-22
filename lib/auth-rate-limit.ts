import { createHmac } from 'node:crypto';
import { db } from '@/lib/db';

export function requestIp(headers: Record<string, string | string[] | undefined> | undefined) {
  // The hosting proxy supplies this header. Missing addresses share one bucket.
  const value = headers?.['x-vercel-forwarded-for'] || headers?.['x-forwarded-for'];
  return (Array.isArray(value) ? value[0] : value)?.split(',')[0]?.trim() || 'unknown';
}

export async function consumeAuthLimit(scope: string, identity: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  const bucket = Math.floor(now / (windowSeconds * 1000));
  const key = createHmac('sha256', process.env.AUTH_SECRET || '').update(`${scope}:${identity}:${bucket}`).digest('hex');
  const row = await db.authRateLimit.upsert({
    where: { key },
    create: { key, attempts: 1, expiresAt: new Date((bucket + 1) * windowSeconds * 1000) },
    update: { attempts: { increment: 1 } },
    select: { attempts: true },
  });
  // Expired counters contain no raw IP/email and never affect a later window.
  if (row.attempts === 1) await db.authRateLimit.deleteMany({ where: { expiresAt: { lt: new Date(now - 86_400_000) } } });
  return row.attempts <= limit;
}
