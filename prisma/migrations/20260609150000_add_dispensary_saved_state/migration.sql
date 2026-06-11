CREATE TABLE "dispensary_favorite_products" (
  "id" TEXT NOT NULL,
  "dispensaryId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dispensary_favorite_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dispensary_saved_filters" (
  "id" TEXT NOT NULL,
  "dispensaryId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "filters" JSONB NOT NULL,
  "searchQuery" TEXT NOT NULL DEFAULT '',
  "sortBy" TEXT NOT NULL DEFAULT 'default',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "dispensary_saved_filters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dispensary_price_alerts" (
  "id" TEXT NOT NULL,
  "dispensaryId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "targetPrice" DECIMAL(10,2) NOT NULL,
  "currentPrice" DECIMAL(10,2) NOT NULL,
  "originalPrice" DECIMAL(10,2),
  "isTriggered" BOOLEAN NOT NULL DEFAULT false,
  "triggeredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "dispensary_price_alerts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "dispensary_favorite_products_dispensaryId_productId_key"
  ON "dispensary_favorite_products"("dispensaryId", "productId");

CREATE INDEX "dispensary_favorite_products_dispensaryId_createdAt_idx"
  ON "dispensary_favorite_products"("dispensaryId", "createdAt");

CREATE INDEX "dispensary_favorite_products_productId_idx"
  ON "dispensary_favorite_products"("productId");

CREATE INDEX "dispensary_saved_filters_dispensaryId_createdAt_idx"
  ON "dispensary_saved_filters"("dispensaryId", "createdAt");

CREATE UNIQUE INDEX "dispensary_price_alerts_dispensaryId_productId_key"
  ON "dispensary_price_alerts"("dispensaryId", "productId");

CREATE INDEX "dispensary_price_alerts_dispensaryId_createdAt_idx"
  ON "dispensary_price_alerts"("dispensaryId", "createdAt");

CREATE INDEX "dispensary_price_alerts_productId_idx"
  ON "dispensary_price_alerts"("productId");

ALTER TABLE "dispensary_favorite_products"
  ADD CONSTRAINT "dispensary_favorite_products_dispensaryId_fkey"
  FOREIGN KEY ("dispensaryId") REFERENCES "dispensaries"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dispensary_favorite_products"
  ADD CONSTRAINT "dispensary_favorite_products_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dispensary_saved_filters"
  ADD CONSTRAINT "dispensary_saved_filters_dispensaryId_fkey"
  FOREIGN KEY ("dispensaryId") REFERENCES "dispensaries"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dispensary_price_alerts"
  ADD CONSTRAINT "dispensary_price_alerts_dispensaryId_fkey"
  FOREIGN KEY ("dispensaryId") REFERENCES "dispensaries"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dispensary_price_alerts"
  ADD CONSTRAINT "dispensary_price_alerts_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
