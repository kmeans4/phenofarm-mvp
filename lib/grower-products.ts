import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import {
  toSafeAvailability,
  toSafeBoolean,
  toSafeNonNegativeInteger,
  toSafeNonNegativeNumber,
  toSafeOptionalNumber,
  toSafeOptionalString,
  toSafeProductName,
  toSafeProductType,
  toSafeStringArray,
  toSafeUnit,
} from '@/lib/product-serializers';

type ProductLike = {
  name?: string | null;
  productType?: string | null;
  subType?: string | null;
  price: Prisma.Decimal | number | null;
  inventoryQty?: number | null;
  unit?: string | null;
  isAvailable?: boolean | null;
  isPriceVisible?: boolean | null;
  images?: string[] | null;
  thcMin?: Prisma.Decimal | number | null;
  thcMax?: Prisma.Decimal | number | null;
  cbdMin?: Prisma.Decimal | number | null;
  cbdMax?: Prisma.Decimal | number | null;
  harvestDate?: Date | string | null;
};

export function serializeProduct<T extends ProductLike>(product: T) {
  const inventoryQty = toSafeNonNegativeInteger(product.inventoryQty, 0);

  return {
    ...product,
    name: toSafeProductName(product.name),
    productType: toSafeProductType(product.productType),
    subType: toSafeOptionalString(product.subType),
    price: toSafeNonNegativeNumber(product.price, 0),
    inventoryQty,
    unit: toSafeUnit(product.unit),
    isAvailable: toSafeAvailability(product.isAvailable, inventoryQty),
    isPriceVisible: toSafeBoolean(product.isPriceVisible, true),
    images: toSafeStringArray(product.images),
    thcMin: toSafeOptionalNumber(product.thcMin),
    thcMax: toSafeOptionalNumber(product.thcMax),
    cbdMin: toSafeOptionalNumber(product.cbdMin),
    cbdMax: toSafeOptionalNumber(product.cbdMax),
    harvestDate: product.harvestDate ? new Date(product.harvestDate).toISOString() : null,
  };
}

export async function getGrowerProductPage(growerId: string, searchParams: URLSearchParams) {
    const productType = searchParams.get('productType');
    const strainId = searchParams.get('strainId');
    const batchId = searchParams.get('batchId');
    const isAvailable = searchParams.get('isAvailable');
    const search = searchParams.get('search')?.trim().slice(0, 200);
    const pageSize = Math.floor(Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 50)));
    const requestedPage = Math.max(1, Math.min(100000, Math.floor(Number(searchParams.get('page')) || 1)));
    const sortBy = ['createdAt', 'name', 'price', 'inventoryQty'].includes(searchParams.get('sortBy') || '') ? searchParams.get('sortBy')! : 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
    const baseWhere: Prisma.ProductWhereInput = {
      growerId, isDeleted: false,
      ...(productType && { productType }), ...(strainId && { strainId }), ...(batchId && { batchId }),
      ...(isAvailable !== null && { isAvailable: isAvailable === 'true' }),
      ...(search && { OR: [{ name: { contains: search, mode: 'insensitive' } }, { strain: { name: { contains: search, mode: 'insensitive' } } }, { productType: { contains: search, mode: 'insensitive' } }, { subType: { contains: search, mode: 'insensitive' } }] }),
    };
    const views: Record<string, Prisma.ProductWhereInput> = {
      all: {}, active: { isAvailable: true, inventoryQty: { gt: 0 } },
      'low-stock': { inventoryQty: { gt: 0, lte: 10 } }, 'out-of-stock': { inventoryQty: { lte: 0 } }, unavailable: { isAvailable: false }, 'quote-only': { isPriceVisible: false },
      'missing-images': { images: { isEmpty: true } }, 'missing-type': { OR: [{ productType: null }, { productType: '' }] },
      hidden: { OR: [{ isAvailable: false }, { inventoryQty: { lte: 0 } }] },
    };
    const view = searchParams.get('view') || 'all';
    const where = { AND: [baseWhere, views[view] || views.all] };
      // Counts are computed in the database; no catalog rows or media are hydrated.
      const clauses = [Prisma.sql`p."growerId" = ${growerId}`, Prisma.sql`p."isDeleted" = false`];
      if (strainId) clauses.push(Prisma.sql`p."strainId" = ${strainId}`);
      if (batchId) clauses.push(Prisma.sql`p."batchId" = ${batchId}`);
      if (productType) clauses.push(Prisma.sql`p."productType" = ${productType}`);
      if (isAvailable !== null) clauses.push(Prisma.sql`p."isAvailable" = ${isAvailable === 'true'}`);
      if (search) clauses.push(Prisma.sql`(p.name ILIKE ${`%${search}%`} OR p."productType" ILIKE ${`%${search}%`} OR p."subType" ILIKE ${`%${search}%`} OR EXISTS (SELECT 1 FROM strains s WHERE s.id = p."strainId" AND s.name ILIKE ${`%${search}%`}))`);
      const [stats] = await db.$queryRaw<Array<Record<string, bigint | Prisma.Decimal>>>(Prisma.sql`
        SELECT COUNT(*) AS "all", COUNT(*) FILTER (WHERE "isAvailable" AND "inventoryQty" > 0) AS active,
          COUNT(*) FILTER (WHERE "inventoryQty" > 0 AND "inventoryQty" <= 10) AS "low-stock",
          COUNT(*) FILTER (WHERE "inventoryQty" <= 0) AS "out-of-stock",
          COUNT(*) FILTER (WHERE NOT "isAvailable") AS unavailable,
          COUNT(*) FILTER (WHERE NOT "isPriceVisible") AS "quote-only",
          COUNT(*) FILTER (WHERE COALESCE(cardinality(images), 0) = 0) AS "missing-images",
          COUNT(*) FILTER (WHERE "productType" IS NULL OR "productType" = '') AS "missing-type",
          COUNT(*) FILTER (WHERE NOT "isAvailable" OR "inventoryQty" <= 0) AS hidden,
          COALESCE(SUM(price * "inventoryQty"), 0) AS "inventoryValue"
        FROM products p WHERE ${Prisma.join(clauses, ' AND ')}`);
    const counts = Object.fromEntries(Object.keys(views).map(key => [key, Number(stats[key] || 0)]));
    const inventoryValue = Number(stats.inventoryValue || 0);
    const page = Math.min(requestedPage, Math.max(1, Math.ceil((counts[view] ?? counts.all) / pageSize)));
    const products = await db.product.findMany({
      where,
      select: {
        id: true, name: true, productType: true, subType: true, strainId: true, batchId: true,
        price: true, inventoryQty: true, unit: true, isAvailable: true, isPriceVisible: true,
        status: true, createdAt: true,
        strain: { select: { id: true, name: true, genetics: true, strainType: true } },
        batch: { select: { id: true, batchNumber: true } },
      },
      skip: (page - 1) * pageSize, take: pageSize,
      orderBy: [{ [sortBy]: sortOrder }, { id: 'asc' }],
    });
    const imageCounts = products.length ? await db.$queryRaw<Array<{ id: string; imageCount: number }>>(Prisma.sql`
      SELECT id, COALESCE(cardinality(images), 0)::integer AS "imageCount" FROM products WHERE id IN (${Prisma.join(products.map(p => p.id))}) AND "growerId" = ${growerId}`) : [];
    const imagesById = new Map(imageCounts.map(row => [row.id, row.imageCount]));
    const summaries = products.map(product => ({ ...serializeProduct(product), imageCount: imagesById.get(product.id) || 0 }));
    return { products: summaries, page, pageSize, total: counts[view] ?? counts.all, counts, inventoryValue };
}
