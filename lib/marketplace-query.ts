import { Prisma } from '@prisma/client';
import { startOfLicenseDay } from '@/lib/license';

/** SQL equivalent for catalog queries; eligibility must be identical to marketplaceGrowerWhere. */
export function marketplaceGrowerSql(now = new Date()) {
  return Prisma.sql`g."isVerified" AND g."licenseStatus" = 'verified' AND (g."licenseExpiry" IS NULL OR g."licenseExpiry" >= ${startOfLicenseDay(now)}) AND g."subscriptionPlan" IN ('seller','pro','business') AND g."subscriptionStatus" IN ('active','trialing') AND (g."subscriptionCurrentPeriodEnd" IS NULL OR g."subscriptionCurrentPeriodEnd" > ${now})`;
}
