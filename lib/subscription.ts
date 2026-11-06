import { db } from '@/lib/db';
import { getGrowerPlan } from '@/lib/plans';
import { sellerAccessSelect, sellerVisibility } from '@/lib/seller-access';
export async function getSubscriptionSummary(growerId: string) {
  const grower = await db.grower.findUniqueOrThrow({
    where: { id: growerId },
    select: { ...sellerAccessSelect, subscriptionCancelAtPeriodEnd: true },
  });
  return {
    plan: getGrowerPlan(grower),
    status: grower.subscriptionStatus || 'inactive',
    visibility: sellerVisibility(grower),
    currentPeriodEnd:
      grower.subscriptionCurrentPeriodEnd?.toISOString() || null,
    cancelAtPeriodEnd: grower.subscriptionCancelAtPeriodEnd,
    checkoutConfigured: false,
    proCheckoutConfigured: false,
    businessCheckoutConfigured: false,
    portalAvailable: false,
  };
}
