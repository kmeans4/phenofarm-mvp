-- CreateEnum
CREATE TYPE "OrderCreatedBy" AS ENUM ('DISPENSARY', 'GROWER');

-- AlterTable
ALTER TABLE "dispensaries"
ADD COLUMN "isOffPlatform" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "offPlatformEmail" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN "acceptedQuoteId" TEXT;

-- AlterTable
ALTER TABLE "orders"
ADD COLUMN "buyerAcknowledgedAt" TIMESTAMP(3),
ADD COLUMN "createdBy" "OrderCreatedBy" NOT NULL DEFAULT 'DISPENSARY';

-- CreateTable
CREATE TABLE "accepted_quotes" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "growerId" TEXT NOT NULL,
    "dispensaryId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "note" TEXT,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedByOrderId" TEXT,

    CONSTRAINT "accepted_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_events" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "actorUserId" TEXT,
    "actorRole" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accepted_quotes_messageId_key" ON "accepted_quotes"("messageId");

-- CreateIndex
CREATE INDEX "accepted_quotes_dispensaryId_growerId_productId_expiresAt_idx" ON "accepted_quotes"("dispensaryId", "growerId", "productId", "expiresAt");

-- CreateIndex
CREATE INDEX "accepted_quotes_consumedByOrderId_idx" ON "accepted_quotes"("consumedByOrderId");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_createdAt_idx" ON "notifications"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "order_status_events_orderId_createdAt_idx" ON "order_status_events"("orderId", "createdAt");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_acceptedQuoteId_fkey" FOREIGN KEY ("acceptedQuoteId") REFERENCES "accepted_quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accepted_quotes" ADD CONSTRAINT "accepted_quotes_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accepted_quotes" ADD CONSTRAINT "accepted_quotes_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "conversation_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accepted_quotes" ADD CONSTRAINT "accepted_quotes_growerId_fkey" FOREIGN KEY ("growerId") REFERENCES "growers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accepted_quotes" ADD CONSTRAINT "accepted_quotes_dispensaryId_fkey" FOREIGN KEY ("dispensaryId") REFERENCES "dispensaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accepted_quotes" ADD CONSTRAINT "accepted_quotes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accepted_quotes" ADD CONSTRAINT "accepted_quotes_consumedByOrderId_fkey" FOREIGN KEY ("consumedByOrderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_events" ADD CONSTRAINT "order_status_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_events" ADD CONSTRAINT "order_status_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
