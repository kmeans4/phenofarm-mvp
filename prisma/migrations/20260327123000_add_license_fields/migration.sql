-- AlterTable
ALTER TABLE "Grower" ADD COLUMN "licenseExpiry" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Dispensary" ADD COLUMN "licenseExpiry" TIMESTAMP(3),
ADD COLUMN "licenseState" TEXT DEFAULT 'VT',
ADD COLUMN "licenseStatus" TEXT NOT NULL DEFAULT 'pending_review',
ADD COLUMN "licenseReviewNotes" TEXT,
ADD COLUMN "verifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "thcMin" DECIMAL(5,2),
ADD COLUMN "thcMax" DECIMAL(5,2),
ADD COLUMN "cbdMin" DECIMAL(5,2),
ADD COLUMN "cbdMax" DECIMAL(5,2),
ADD COLUMN "harvestDate" TIMESTAMP(3);
