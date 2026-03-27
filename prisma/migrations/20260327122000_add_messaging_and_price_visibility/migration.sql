-- Phase 1 negotiated pricing + in-app messaging

ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "isPriceVisible" BOOLEAN NOT NULL DEFAULT true;

DO $$ BEGIN
  CREATE TYPE "ConversationMessageType" AS ENUM ('TEXT', 'PRICING_REQUEST', 'OFFER', 'SYSTEM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "conversations" (
  "id" TEXT NOT NULL,
  "growerId" TEXT NOT NULL,
  "dispensaryId" TEXT NOT NULL,
  "productId" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "growerLastReadAt" TIMESTAMP(3),
  "dispensaryLastReadAt" TIMESTAMP(3),
  "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "conversation_messages" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderUserId" TEXT NOT NULL,
  "messageType" "ConversationMessageType" NOT NULL DEFAULT 'TEXT',
  "body" TEXT NOT NULL,
  "productId" TEXT,
  "offerQuantity" INTEGER,
  "offerUnitPrice" DECIMAL(10,2),
  "offerNote" TEXT,
  "offerStatus" "OfferStatus",
  "respondedToMessageId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "conversations"
    ADD CONSTRAINT "conversations_growerId_fkey" FOREIGN KEY ("growerId") REFERENCES "growers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "conversations"
    ADD CONSTRAINT "conversations_dispensaryId_fkey" FOREIGN KEY ("dispensaryId") REFERENCES "dispensaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "conversation_messages"
    ADD CONSTRAINT "conversation_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "conversation_messages"
    ADD CONSTRAINT "conversation_messages_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "conversations_growerId_dispensaryId_key" ON "conversations"("growerId", "dispensaryId");
CREATE INDEX IF NOT EXISTS "conversations_growerId_lastMessageAt_idx" ON "conversations"("growerId", "lastMessageAt");
CREATE INDEX IF NOT EXISTS "conversations_dispensaryId_lastMessageAt_idx" ON "conversations"("dispensaryId", "lastMessageAt");
CREATE INDEX IF NOT EXISTS "conversation_messages_conversationId_createdAt_idx" ON "conversation_messages"("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "conversation_messages_senderUserId_idx" ON "conversation_messages"("senderUserId");
