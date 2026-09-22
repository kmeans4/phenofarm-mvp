ALTER TABLE "dispensaries" ADD COLUMN "createdByGrowerId" TEXT;
ALTER TABLE "dispensaries" ADD CONSTRAINT "dispensaries_createdByGrowerId_fkey" FOREIGN KEY ("createdByGrowerId") REFERENCES "growers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- Claim legacy off-platform records only where the existing relationship is unambiguous.
UPDATE "dispensaries" d SET "createdByGrowerId" = owners."growerId" FROM (
  SELECT "dispensaryId", MIN("growerId") AS "growerId" FROM "orders" GROUP BY "dispensaryId" HAVING COUNT(DISTINCT "growerId") = 1
) owners WHERE d.id = owners."dispensaryId" AND d."isOffPlatform" = true AND d."userId" IS NULL;
CREATE INDEX "dispensaries_createdByGrowerId_idx" ON "dispensaries"("createdByGrowerId");
