-- AlterTable
ALTER TABLE "batches" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "thc" SET DATA TYPE DECIMAL(5,2) USING ("thc"::DECIMAL(5,2)),
ALTER COLUMN "cbd" SET DATA TYPE DECIMAL(5,2) USING ("cbd"::DECIMAL(5,2)),
ALTER COLUMN "totalCannabinoids" SET DATA TYPE DECIMAL(5,2) USING ("totalCannabinoids"::DECIMAL(5,2));
ALTER TABLE "batches" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "conversations" ALTER COLUMN "createdByUserId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "product_type_configs" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "product_type_configs" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "batches_strainId_idx" ON "batches"("strainId");

-- CreateIndex
CREATE INDEX "conversation_messages_productId_idx" ON "conversation_messages"("productId");

-- CreateIndex
CREATE INDEX "conversation_messages_respondedToMessageId_idx" ON "conversation_messages"("respondedToMessageId");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_items_productId_idx" ON "order_items"("productId");

-- CreateIndex
CREATE INDEX "order_items_growerId_idx" ON "order_items"("growerId");

-- CreateIndex
CREATE INDEX "order_items_acceptedQuoteId_idx" ON "order_items"("acceptedQuoteId");

-- CreateIndex
CREATE INDEX "order_status_events_actorUserId_idx" ON "order_status_events"("actorUserId");

-- CreateIndex
CREATE INDEX "orders_growerId_status_createdAt_idx" ON "orders"("growerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "orders_dispensaryId_status_createdAt_idx" ON "orders"("dispensaryId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "orders_growerId_createdAt_idx" ON "orders"("growerId", "createdAt");

-- CreateIndex
CREATE INDEX "products_growerId_isDeleted_isAvailable_idx" ON "products"("growerId", "isDeleted", "isAvailable");

-- CreateIndex
CREATE INDEX "products_isDeleted_isAvailable_idx" ON "products"("isDeleted", "isAvailable");

-- CreateIndex
CREATE INDEX "products_strainId_idx" ON "products"("strainId");

-- CreateIndex
CREATE INDEX "products_batchId_idx" ON "products"("batchId");

-- Enforce uniqueness for code-defined global defaults despite nullable growerId.
CREATE UNIQUE INDEX "product_type_configs_global_type_key"
ON "product_type_configs"("type") WHERE "growerId" IS NULL;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_respondedToMessageId_fkey" FOREIGN KEY ("respondedToMessageId") REFERENCES "conversation_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
