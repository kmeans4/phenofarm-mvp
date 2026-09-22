import { buyerProductSelect, serializeBuyerProduct } from '@/lib/buyer-products';
import type { Prisma } from '@prisma/client';
export const buyerAlertInclude = { product: { select: buyerProductSelect } } satisfies Prisma.DispensaryPriceAlertInclude;
export function serializeBuyerAlert(alert: Prisma.DispensaryPriceAlertGetPayload<{ include: typeof buyerAlertInclude }>) {
  const product = serializeBuyerProduct(alert.product);
  const currentPrice = product.price;
  const originalPrice = currentPrice == null || alert.originalPrice == null ? null : Number(alert.originalPrice);
  return { id: alert.id, productId: alert.productId, productName: product.name,
    productImage: product.images[0], growerName: product.grower.businessName, growerId: product.grower.id,
    targetPrice: Number(alert.targetPrice), currentPrice, originalPrice,
    inventoryQty: product.inventoryQty, thc: product.thc, productType: product.productType, unit: product.unit,
    createdAt: alert.createdAt.toISOString(), isTriggered: currentPrice != null && alert.isTriggered,
    triggeredAt: alert.triggeredAt?.toISOString(),
    discountPercent: originalPrice && currentPrice != null ? Math.round((originalPrice - currentPrice) / originalPrice * 100) : undefined,
  };
}
