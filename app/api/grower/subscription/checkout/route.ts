import { NextResponse } from 'next/server';
import { requireGrower } from '@/lib/auth-helpers';
import { BILLING_DISABLED_MESSAGE } from '@/lib/seller-access';
export async function POST() {
  const auth = await requireGrower();
  if ('error' in auth) return auth.error;
  return NextResponse.json(
    { error: BILLING_DISABLED_MESSAGE },
    { status: 503 }
  );
}
