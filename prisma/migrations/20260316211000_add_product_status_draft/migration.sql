-- Add draft/published lifecycle status to products
DO $$ BEGIN
  CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "status" "ProductStatus" NOT NULL DEFAULT 'PUBLISHED';
