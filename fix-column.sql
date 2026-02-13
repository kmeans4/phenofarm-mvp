-- Rename the column to match Prisma schema exactly
-- Using quotes to preserve case sensitivity
ALTER TABLE "users" RENAME COLUMN "passwordhash" TO "passwordHash";
