import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { getSubscriptionPriceId, STRIPE_CONFIG, stripe, type SubscriptionPlan } from '@/lib/stripe';

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

  const grower = await db.grower.findUnique({
    where: { id: user.growerId },
    select: {
      id: true,
      businessName: true,
      stripeCustomerId: true,
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  if (!grower) {
    return NextResponse.json({ error: 'Grower not found' }, { status: 404 });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: grower.stripeCustomerId || undefined,
    customer_email: grower.stripeCustomerId ? undefined : grower.user.email,
    client_reference_id: grower.id,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: STRIPE_CONFIG.getSubscriptionSuccessUrl(),
    cancel_url: STRIPE_CONFIG.getSubscriptionCancelUrl(),
    metadata: {
      growerId: grower.id,
      plan,
      businessName: grower.businessName,
    },
    subscription_data: {
      metadata: {
        growerId: grower.id,
        plan,
      },
    },
  }) as { url?: string | null };

  if (!checkoutSession.url) {
    return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 502 });
  }

  return NextResponse.json({ url: checkoutSession.url });
}
