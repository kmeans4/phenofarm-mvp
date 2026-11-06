import { NextResponse } from 'next/server';
// Old Stripe events cannot activate or change the new business-level entitlement.
export async function POST() {
  return NextResponse.json(
    {
      error:
        'Subscription processing is disabled pending approved processor integration.',
    },
    { status: 503 }
  );
}
