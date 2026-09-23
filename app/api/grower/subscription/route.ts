import { NextResponse } from 'next/server';
import { requireGrower } from '@/lib/auth-helpers';
import { getSubscriptionSummary } from '@/lib/subscription';

export async function GET() {
  const auth = await requireGrower();
  if ('error' in auth) return auth.error;
  try {
    return NextResponse.json(await getSubscriptionSummary(auth.growerId));
  } catch {
    return NextResponse.json({ error: 'Unable to load billing details' }, { status: 503 });
  }
}
