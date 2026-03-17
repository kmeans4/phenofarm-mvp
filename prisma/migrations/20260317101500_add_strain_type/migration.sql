-- CreateEnum (safe if rerun)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StrainType') THEN
    CREATE TYPE "StrainType" AS ENUM ('INDICA', 'SATIVA', 'HYBRID');
  END IF;
END
$$;

-- AlterTable (nullable + safe if already applied)
ALTER TABLE "strains"
ADD COLUMN IF NOT EXISTS "strainType" "StrainType";
