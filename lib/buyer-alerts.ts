import { buyerProductSelect, serializeBuyerProduct } from '@/lib/buyer-products';
import type { Prisma } from '@prisma/client';
import { productImagesById } from '@/lib/product-images';
export const buyerAlertInclude = { product: { select: buyerProductSelect } } satisfies Prisma.DispensaryPriceAlertInclude;
export function serializeBuyerAlert(alert: Prisma.DispensaryPriceAlertGetPayload<{ include: typeof buyerAlertInclude }>, images: string[] = []) {
  const product = serializeBuyerProduct(alert.product, images);
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

export async function serializeBuyerAlerts(alerts: Prisma.DispensaryPriceAlertGetPayload<{ include: typeof buyerAlertInclude }>[]) {
  const images = await productImagesById(alerts.map(alert => alert.productId));
  return alerts.map(alert => serializeBuyerAlert(alert, images.get(alert.productId)));
}
