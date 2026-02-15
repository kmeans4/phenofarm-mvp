-- AlterTable
ALTER TABLE "growers" ADD COLUMN "stripeAccountId" TEXT;
ALTER TABLE "growers" ADD COLUMN "stripeAccountStatus" TEXT DEFAULT 'pending';
ALTER TABLE "growers" ADD COLUMN "connectOnboardedAt" TIMESTAMP(3);
