-- Allow multiple conversations between the same grower and dispensary when they are scoped to different products.
-- Keep legacy grower-wide conversations (productId IS NULL) intact.

DROP INDEX IF EXISTS "conversations_growerId_dispensaryId_key";

CREATE INDEX IF NOT EXISTS "conversations_growerId_dispensaryId_idx"
  ON "conversations"("growerId", "dispensaryId");

CREATE INDEX IF NOT EXISTS "conversations_growerId_dispensaryId_productId_idx"
  ON "conversations"("growerId", "dispensaryId", "productId");
