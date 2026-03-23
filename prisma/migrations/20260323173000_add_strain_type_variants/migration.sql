-- Add additional strain type enum values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'StrainType' AND e.enumlabel = 'SATIVA_DOM_HYBRID'
  ) THEN
    ALTER TYPE "StrainType" ADD VALUE 'SATIVA_DOM_HYBRID';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'StrainType' AND e.enumlabel = 'INDICA_DOM_HYBRID'
  ) THEN
    ALTER TYPE "StrainType" ADD VALUE 'INDICA_DOM_HYBRID';
  END IF;
END $$;
