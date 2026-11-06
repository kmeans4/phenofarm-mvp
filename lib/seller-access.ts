import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { marketplaceGrowerWhere, isLicenseExpired } from '@/lib/license';
import { hasActiveSubscription, type GrowerPlanSource } from '@/lib/plans';
export const SELLER_ACCESS_MESSAGE =
  'This grower is not accepting new requests. Existing accepted orders remain available.';
export const BILLING_DISABLED_MESSAGE =
  'Online subscriptions are not available yet. Contact support for availability. You can keep preparing your catalog for free.';
export const PAID_ACTIONS_ENABLED = false;
export type SellerVisibility = 'visible' | 'subscription' | 'verification';
export const sellerAccessSelect = {
  isVerified: true,
  licenseStatus: true,
  licenseExpiry: true,
  subscriptionPlan: true,
  subscriptionStatus: true,
  subscriptionCurrentPeriodEnd: true,
} as const;
export function sellerVisibility(
  grower: GrowerPlanSource & {
    isVerified: boolean;
    licenseStatus?: string;
    licenseExpiry?: Date | string | null;
  }
): SellerVisibility {
  if (
    !grower.isVerified ||
    grower.licenseStatus !== 'verified' ||
    isLicenseExpired(grower.licenseExpiry)
  )
    return 'verification';
  return hasActiveSubscription(grower) ? 'visible' : 'subscription';
}
export async function getSellerVisibility(id: string) {
  return sellerVisibility(
    await db.grower.findUniqueOrThrow({
      where: { id },
      select: sellerAccessSelect,
    })
  );
}
export async function sellerCanTrade(
  growerId: string,
  tx: Prisma.TransactionClient = db
) {
  return Boolean(
    await tx.grower.findFirst({
      where: { id: growerId, ...marketplaceGrowerWhere() },
      select: { id: true },
    })
  );
}
export async function canSendSellerMessage(
  growerId: string,
  dispensaryId: string,
  messageType: string,
  tx: Prisma.TransactionClient = db
) {
  if (await sellerCanTrade(growerId, tx)) return true;
  return (
    messageType === 'TEXT' &&
    Boolean(
      await tx.order.findFirst({
        where: {
          growerId,
          dispensaryId,
          status: { notIn: ['PENDING', 'CANCELLED'] },
        },
        select: { id: true },
      })
    )
  );
}

export class SellerAccessError extends Error { constructor() { super(SELLER_ACCESS_MESSAGE); } }
