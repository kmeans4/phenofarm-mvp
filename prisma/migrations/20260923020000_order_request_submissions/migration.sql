-- Durable, buyer-scoped receipts for retrying order requests after response loss.
CREATE TABLE "order_request_submissions" (
    "id" TEXT NOT NULL,
    "dispensaryId" TEXT NOT NULL,
    "key" VARCHAR(128) NOT NULL,
    "payloadHash" CHAR(64) NOT NULL,
    "receipt" JSONB NOT NULL DEFAULT '{"orders":[],"quotedItems":[]}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_request_submissions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "order_request_submissions_dispensaryId_key_key"
    ON "order_request_submissions"("dispensaryId", "key");
ALTER TABLE "order_request_submissions" ADD CONSTRAINT "order_request_submissions_dispensaryId_fkey"
    FOREIGN KEY ("dispensaryId") REFERENCES "dispensaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
