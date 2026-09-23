import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { getSubscriptionPriceId, type SubscriptionPlan } from '@/lib/stripe';

import { beginSubscriptionCheckout, SubscriptionCheckoutError } from '@/lib/subscription-checkout';

const VALID_PLANS = new Set<SubscriptionPlan>(['pro', 'business']);

export async function POST(request: NextRequest) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  if (user.role !== 'GROWER' || !user.growerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const requestedPlan = body?.plan;

  if (!VALID_PLANS.has(requestedPlan)) {
    return NextResponse.json({ error: 'Choose a valid cultivator subscription plan' }, { status: 400 });
  }

  const plan = requestedPlan as SubscriptionPlan;
  const priceId = getSubscriptionPriceId(plan);

  if (!process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_TEST_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe Billing is not configured for this environment' }, { status: 503 });
  }

  if (!priceId) {
    return NextResponse.json({ error: `Stripe price ID is missing for the ${plan} plan` }, { status: 503 });
  }

  try {
    const url = await beginSubscriptionCheckout(user.growerId, plan);
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof SubscriptionCheckoutError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Billing is temporarily unavailable. Please try again.' }, { status: 503 });
  }
}
