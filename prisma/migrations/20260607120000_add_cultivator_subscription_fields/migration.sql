ALTER TABLE "growers" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "growers" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "growers" ADD COLUMN "subscriptionPlan" TEXT DEFAULT 'free';
ALTER TABLE "growers" ADD COLUMN "subscriptionStatus" TEXT DEFAULT 'inactive';
ALTER TABLE "growers" ADD COLUMN "subscriptionCurrentPeriodEnd" TIMESTAMP(3);
ALTER TABLE "growers" ADD COLUMN "subscriptionCancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;
