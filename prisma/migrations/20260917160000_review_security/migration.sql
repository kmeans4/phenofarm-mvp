ALTER TABLE "growers" ADD COLUMN "subscriptionEventCreatedAt" INTEGER NOT NULL DEFAULT 0;
CREATE TABLE "auth_rate_limits" ("key" TEXT PRIMARY KEY, "attempts" INTEGER NOT NULL DEFAULT 1, "expiresAt" TIMESTAMP(3) NOT NULL);
CREATE INDEX "auth_rate_limits_expiresAt_idx" ON "auth_rate_limits"("expiresAt");
CREATE TABLE "stripe_webhook_events" ("id" TEXT PRIMARY KEY, "type" TEXT NOT NULL, "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
