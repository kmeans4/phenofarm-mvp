import {
  buyerProductSelect,
  serializeBuyerProduct,
} from '@/lib/buyer-products';
import type { Prisma } from '@prisma/client';
import { productImagesById } from '@/lib/product-images';
export const buyerAlertInclude = {
  product: { select: buyerProductSelect },
} satisfies Prisma.DispensaryPriceAlertInclude;
export function serializeBuyerAlert(
  alert: Prisma.DispensaryPriceAlertGetPayload<{
    include: typeof buyerAlertInclude;
  }>,
  images: string[] = []
) {
  const product = serializeBuyerProduct(alert.product, images);
  const currentPrice = product.price;
  const originalPrice =
    currentPrice == null || alert.originalPrice == null
      ? null
      : Number(alert.originalPrice);
  return {
    id: alert.id,
    productId: alert.productId,
    productName: product.name,
    productImage: product.images[0],
    growerName: product.grower.businessName,
    growerId: product.grower.id,
    targetPrice: Number(alert.targetPrice),
    currentPrice,
    originalPrice,
    inventoryQty: product.inventoryQty,
    thc: product.thc,
    productType: product.productType,
    unit: product.unit,
    createdAt: alert.createdAt.toISOString(),
    isTriggered: currentPrice != null && alert.isTriggered,
    triggeredAt: alert.triggeredAt?.toISOString(),
    discountPercent:
      originalPrice && currentPrice != null
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : undefined,
  };
}

export async function serializeBuyerAlerts(
  alerts: Prisma.DispensaryPriceAlertGetPayload<{
    include: typeof buyerAlertInclude;
  }>[]
) {
  const images = await productImagesById(
    alerts.map((alert) => alert.productId)
  );
  return alerts.map((alert) =>
    serializeBuyerAlert(alert, images.get(alert.productId))
  );
}

/** Run after a grower price edit; row locks make repeated/concurrent checks idempotent. */
export async function refreshProductPriceAlerts(productId: string) {
  const [{ db }, { Prisma }, { startOfLicenseDay }] = await Promise.all([
    import('@/lib/db'),
    import('@prisma/client'),
    import('@/lib/license'),
  ]);
  await db.$transaction(async (tx) => {
    const changed = await tx.$queryRaw<
      Array<{ name: string; userId: string | null; notify: boolean }>
    >(Prisma.sql`
      WITH candidates AS (
        SELECT a.id, a."currentPrice" AS previous, a."isTriggered" AS triggered,
          p.price, p.name, d."userId", (p.price <= a."targetPrice" AND p.price < a."currentPrice") AS dropped
        FROM dispensary_price_alerts a JOIN dispensaries d ON d.id = a."dispensaryId"
        JOIN products p ON p.id = a."productId" JOIN growers g ON g.id = p."growerId"
        WHERE p.id = ${productId} AND NOT p."isDeleted" AND p.status = 'PUBLISHED'
          AND p."isPriceVisible" AND g."isVerified" AND (g."licenseExpiry" IS NULL OR g."licenseExpiry" >= ${startOfLicenseDay()})
          AND a."currentPrice" IS DISTINCT FROM p.price
        ORDER BY a.id FOR UPDATE OF a
      ) UPDATE dispensary_price_alerts a SET "currentPrice" = c.price,
        "isTriggered" = a."isTriggered" OR c.dropped,
        "triggeredAt" = CASE WHEN c.dropped THEN CURRENT_TIMESTAMP ELSE a."triggeredAt" END,
        "originalPrice" = CASE WHEN c.dropped THEN c.previous ELSE a."originalPrice" END,
        "updatedAt" = CURRENT_TIMESTAMP FROM candidates c WHERE a.id = c.id
      RETURNING c.name, c."userId", (c.dropped AND NOT c.triggered) AS notify`);
    const notifications = changed
      .filter((row) => row.notify && row.userId)
      .map((row) => ({
        userId: row.userId!,
        type: 'PRICE_ALERT_TRIGGERED',
        title: 'Price dropped',
        body: `${row.name} reached your target price.`,
        href: `/dispensary/catalog?product=${encodeURIComponent(productId)}`,
      }));
    if (notifications.length)
      await tx.notification.createMany({ data: notifications });
  });
}
