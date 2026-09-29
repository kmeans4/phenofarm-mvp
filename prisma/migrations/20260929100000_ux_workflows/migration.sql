-- Additive UX state. Existing approval flags remain authoritative during rollout.
BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE EXTENSION IF NOT EXISTS pg_trgm;
ALTER TABLE "users" ADD COLUMN "suspendedAt" TIMESTAMP(3), ADD COLUMN "signupProofHash" TEXT;
ALTER TABLE "growers" ADD COLUMN "licenseStatus" "LicenseStatus" NOT NULL DEFAULT 'pending_review',
  ADD COLUMN "licenseReviewNotes" TEXT, ADD COLUMN "licenseSubmittedAt" TIMESTAMP(3), ADD COLUMN "previousLicenseNumber" TEXT;
UPDATE "growers" SET "licenseStatus" = 'verified' WHERE "isVerified" = true;
ALTER TABLE "dispensaries" ADD COLUMN "cart" JSONB, ADD COLUMN "orderDefaults" JSONB,
  ADD COLUMN "licenseSubmittedAt" TIMESTAMP(3), ADD COLUMN "previousLicenseNumber" TEXT;
ALTER TABLE "order_status_events" ADD COLUMN "note" TEXT, ADD COLUMN "undoOfEventId" TEXT;
CREATE UNIQUE INDEX "order_status_events_undoOfEventId_key" ON "order_status_events"("undoOfEventId");
COMMIT;
