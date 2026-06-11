ALTER TABLE "growers"
ADD COLUMN "commercialMinimumOrder" TEXT,
ADD COLUMN "commercialFulfillmentMethods" TEXT,
ADD COLUMN "commercialFulfillmentRegion" TEXT,
ADD COLUMN "commercialPaymentTerms" TEXT,
ADD COLUMN "commercialResponseWindow" TEXT,
ADD COLUMN "commercialContactNote" TEXT,
ADD COLUMN "commercialTermsUpdatedAt" TIMESTAMP(3);
