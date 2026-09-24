import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { monitorAuthorized, monitoringEnabled } from '@/lib/operational-monitoring';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'no-store' };
  if (!monitorAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  try {
    await db.$queryRaw`SELECT 1`;
    const signal = await db.operationalSignal.findUnique({ where: { id: 'server-error' } });
    return NextResponse.json({ ok: true, monitoring: monitoringEnabled(), checkedAt: new Date().toISOString(),
      serverErrors: { count: signal?.count || 0, lastOccurredAt: signal?.lastOccurredAt || null } }, { headers });
  } catch {
    return NextResponse.json({ ok: false, reason: 'database-unavailable' }, { status: 503, headers });
  }
}
