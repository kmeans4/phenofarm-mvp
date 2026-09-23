-- Some existing databases recorded the original lifecycle migration without
-- creating its enum/column. Repair that drift without changing existing rows.
DO $$ BEGIN
  CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "status" "ProductStatus" NOT NULL DEFAULT 'PUBLISHED';
