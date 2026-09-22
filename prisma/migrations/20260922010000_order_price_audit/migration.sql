-- Additive audit snapshots for explicitly negotiated grower-recorded prices.
ALTER TABLE "order_items"
  ADD COLUMN "catalogUnitPrice" DECIMAL(10,2),
  ADD COLUMN "priceOverrideReason" VARCHAR(240);
