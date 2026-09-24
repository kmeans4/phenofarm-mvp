CREATE TABLE "policy_acceptances" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "termsVersion" TEXT NOT NULL,
  "termsSha256" TEXT NOT NULL,
  "privacyVersion" TEXT NOT NULL,
  "privacySha256" TEXT NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "source" TEXT NOT NULL,
  CONSTRAINT "policy_acceptances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "policy_acceptances_userId_termsVersion_privacyVersion_key" ON "policy_acceptances"("userId", "termsVersion", "privacyVersion");
CREATE TABLE "operational_signals" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "count" INTEGER NOT NULL DEFAULT 0,
  "lastOccurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
