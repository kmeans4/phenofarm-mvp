import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { STRIPE_CONFIG } from '@/lib/stripe';

export async function GET() {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  if (user.role !== 'GROWER' || !user.growerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const grower = await db.grower.findUnique({
    where: { id: user.growerId },
    select: {
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      subscriptionCurrentPeriodEnd: true,
      subscriptionCancelAtPeriodEnd: true,
    },
  });

  return NextResponse.json({
    plan: grower?.subscriptionPlan || 'free',
    status: grower?.subscriptionStatus || 'inactive',
    currentPeriodEnd: grower?.subscriptionCurrentPeriodEnd?.toISOString() || null,
    cancelAtPeriodEnd: Boolean(grower?.subscriptionCancelAtPeriodEnd),
    checkoutConfigured: Boolean(STRIPE_CONFIG.proPriceId || STRIPE_CONFIG.businessPriceId),
    proCheckoutConfigured: Boolean(STRIPE_CONFIG.proPriceId),
    businessCheckoutConfigured: Boolean(STRIPE_CONFIG.businessPriceId),
    portalAvailable: Boolean(grower?.stripeCustomerId && grower?.stripeSubscriptionId),
  });
}
