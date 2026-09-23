CREATE INDEX IF NOT EXISTS "orders_dispensaryId_createdAt_idx" ON "orders"("dispensaryId", "createdAt");
CREATE INDEX IF NOT EXISTS "orders_status_createdAt_idx" ON "orders"("status", "createdAt");
