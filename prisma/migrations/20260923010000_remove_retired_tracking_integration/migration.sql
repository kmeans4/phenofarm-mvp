-- Retire the unused external tracking data. Product, batch, and COA records stay intact.
-- Keep applied migration files unchanged; this forward migration removes their legacy objects.
BEGIN;
SET LOCAL lock_timeout = '5s';

DROP TABLE IF EXISTS "metrc_sync_logs";
ALTER TABLE "products" DROP COLUMN IF EXISTS "lastSyncedAt";

COMMIT;
