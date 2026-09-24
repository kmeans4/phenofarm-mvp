import type { Prisma } from '@prisma/client';
import { marketplaceGrowerWhere } from '@/lib/license';
import { productImagesById } from '@/lib/product-images';
import { productLabReportsById } from '@/lib/buyer-lab-reports';
import type { LabReportKey } from '@/lib/lab-reports';

// List payloads deliberately exclude image blobs and unused legacy/test fields.
export const buyerProductSelect = {
  id: true, name: true, price: true, isPriceVisible: true, strainId: true,
  productType: true, subType: true, unit: true, thcMin: true, thcMax: true,
  cbdMin: true, cbdMax: true, inventoryQty: true, isAvailable: true, createdAt: true,
  growerId: true,
  grower: { select: { id: true, businessName: true, city: true, state: true, isVerified: true } },
  strain: { select: { id: true, name: true, genetics: true } },
  batch: { select: { thc: true, cbd: true } },
} satisfies Prisma.ProductSelect;

export function buyerProductWhere(): Prisma.ProductWhereInput {
  return { isDeleted: false, status: 'PUBLISHED', grower: marketplaceGrowerWhere() };
}

export function productThumbnail(id: string) {
  return `/api/dispensary/products/${encodeURIComponent(id)}/thumbnail`;
}

export function serializeBuyerProduct(product: Prisma.ProductGetPayload<{ select: typeof buyerProductSelect }>, images: string[] = [], labReports: LabReportKey[] = []) {
  const number = (value: unknown) => value == null ? null : Number(value);
  return {
    id: product.id, name: product.name,
    price: product.isPriceVisible ? Number(product.price) : null,
    isPriceVisible: product.isPriceVisible,
    strain: product.strain?.name ?? null, strainId: product.strainId,
    strainType: product.strain?.genetics ?? null, productType: product.productType,
    subType: product.subType, unit: product.unit,
    thc: number(product.batch?.thc ?? product.thcMax ?? product.thcMin),
    cbd: number(product.batch?.cbd ?? product.cbdMax ?? product.cbdMin),
    images, labReports, inventoryQty: product.inventoryQty,
    isAvailable: product.isAvailable && product.inventoryQty > 0,
    createdAt: product.createdAt.toISOString(),
    grower: { id: product.grower.id, businessName: product.grower.businessName,
      location: [product.grower.city, product.grower.state].filter(Boolean).join(', ') || null,
      isVerified: product.grower.isVerified },
  };
}

export async function serializeBuyerProducts(products: Prisma.ProductGetPayload<{ select: typeof buyerProductSelect }>[]) {
  const ids = products.map(product => product.id);
  const [images, reports] = await Promise.all([productImagesById(ids), productLabReportsById(ids)]);
  return products.map(product => serializeBuyerProduct(product, images.get(product.id), reports.get(product.id)));
}

export function parsePage(value: string | null, fallback = 1, maximum = 100000) {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? Math.min(maximum, Math.max(1, parsed)) : fallback;
}

export function normalizeProductIds(value: unknown, maximum = 200): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === 'string' && id.length > 0 && id.length <= 100))].slice(0, maximum)
    : [];
}
