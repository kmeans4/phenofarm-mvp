-- METRC table and product sync metadata are intentionally preserved.
-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_cartId_fkey";

-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_growerId_fkey";

-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "carts" DROP CONSTRAINT "carts_dispensaryId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_orderId_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_userId_fkey";

-- AlterTable
ALTER TABLE "growers" DROP COLUMN "connectOnboardedAt",
DROP COLUMN "stripeAccountId",
DROP COLUMN "stripeAccountStatus";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "categoryLegacy",
DROP COLUMN "cbdLegacy",
DROP COLUMN "strainLegacy",
DROP COLUMN "subcategoryLegacy",
DROP COLUMN "thcLegacy";

-- DropTable
DROP TABLE "cart_items";

-- DropTable
DROP TABLE "carts";

-- DropTable
DROP TABLE "payments";

-- DropTable
DROP TABLE "sessions";

-- DropEnum
DROP TYPE "PaymentMethod";

-- DropEnum
DROP TYPE "PaymentStatus";
