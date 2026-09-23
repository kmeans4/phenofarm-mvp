import { db } from '@/lib/db';
import { STRIPE_CONFIG, isStripeConfigured } from '@/lib/stripe';
import { getGrowerPlan } from '@/lib/plans';

export async function getSubscriptionSummary(growerId: string) {
  const grower = await db.grower.findUniqueOrThrow({
    where: { id: growerId },
    select: { stripeCustomerId: true, stripeSubscriptionId: true, subscriptionPlan: true, subscriptionStatus: true, subscriptionCurrentPeriodEnd: true, subscriptionCancelAtPeriodEnd: true },
  });
  const configured = isStripeConfigured() && Boolean(process.env.NEXTAUTH_URL);
  return {
    plan: getGrowerPlan(grower),
    status: grower.subscriptionStatus || 'inactive',
    currentPeriodEnd: grower.subscriptionCurrentPeriodEnd?.toISOString() || null,
    cancelAtPeriodEnd: grower.subscriptionCancelAtPeriodEnd,
    checkoutConfigured: configured && Boolean(STRIPE_CONFIG.proPriceId || STRIPE_CONFIG.businessPriceId),
    proCheckoutConfigured: configured && Boolean(STRIPE_CONFIG.proPriceId),
    businessCheckoutConfigured: configured && Boolean(STRIPE_CONFIG.businessPriceId),
    portalAvailable: configured && Boolean(grower.stripeCustomerId && grower.stripeSubscriptionId),
  };
}
