import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { STRIPE_CONFIG, stripe } from '@/lib/stripe';

export async function POST() {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  if (user.role !== 'GROWER' || !user.growerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_TEST_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe Billing is not configured for this environment' }, { status: 503 });
  }

  const grower = await db.grower.findUnique({
    where: { id: user.growerId },
    select: {
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });

  if (!grower?.stripeCustomerId || !grower.stripeSubscriptionId) {
    return NextResponse.json({ error: 'No active cultivator subscription is connected yet' }, { status: 400 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: grower.stripeCustomerId,
    return_url: STRIPE_CONFIG.getPortalReturnUrl(),
  }) as { url?: string | null };

  if (!portalSession.url) {
    return NextResponse.json({ error: 'Stripe did not return a portal URL' }, { status: 502 });
  }

  return NextResponse.json({ url: portalSession.url });
}
