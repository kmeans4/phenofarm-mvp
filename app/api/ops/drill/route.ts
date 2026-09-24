import { NextResponse } from 'next/server';
import { monitorAuthorized, monitoringEnabled } from '@/lib/operational-monitoring';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (!monitorAuthorized(request) || !monitoringEnabled()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Only the authenticated monitor can exercise the real framework error hook.
  // This request fails; no shared app state, customer record, or route is changed.
  throw new Error('PhenoShop controlled monitoring drill');
}
