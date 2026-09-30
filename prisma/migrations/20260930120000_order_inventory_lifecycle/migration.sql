-- Additive only: do not infer or change historical stock balances.
-- Existing rows and writes from old application versions are quarantined for review.
CREATE TYPE "OrderInventoryState" AS ENUM ('LEGACY_UNREVIEWED', 'NOT_DEDUCTED', 'DEDUCTED');
ALTER TABLE "orders" ADD COLUMN "inventoryState" "OrderInventoryState" NOT NULL DEFAULT 'LEGACY_UNREVIEWED';
