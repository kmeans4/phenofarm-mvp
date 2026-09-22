import { persistMediaReference } from '@/lib/blob-storage';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import { Prisma } from '@prisma/client';
import { parseProductPayload, PRODUCT_STATUS } from '@/lib/product-payload';
import { apiError, logApiError } from '@/lib/api-response';
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
import { canCreateListings, FREE_LISTING_LIMIT_MESSAGE } from '@/lib/plans';

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

function serializeProduct<T extends ProductLike>(product: T) {
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

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return apiError(401, 'UNAUTHORIZED', 'Unauthorized');
    const user = session.user;
    if (user.role !== 'GROWER' || !user.growerId) return apiError(403, 'FORBIDDEN', 'Forbidden');

    const { searchParams } = new URL(request.url);
    const productType = searchParams.get('productType');
    const strainId = searchParams.get('strainId');
    const batchId = searchParams.get('batchId');
    const isAvailable = searchParams.get('isAvailable');
    const search = searchParams.get('search')?.trim().slice(0, 200);
    const paged = searchParams.get('paged') === 'true';
    const pageSize = Math.floor(Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 50)));
    const requestedPage = Math.max(1, Math.min(100000, Math.floor(Number(searchParams.get('page')) || 1)));
    const sortBy = ['createdAt', 'name', 'price', 'inventoryQty'].includes(searchParams.get('sortBy') || '') ? searchParams.get('sortBy')! : 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
    const baseWhere: Prisma.ProductWhereInput = {
      growerId: user.growerId, isDeleted: false,
      ...(productType && { productType }), ...(strainId && { strainId }), ...(batchId && { batchId }),
      ...(isAvailable !== null && { isAvailable: isAvailable === 'true' }),
      ...(search && { OR: [{ name: { contains: search, mode: 'insensitive' } }, { strain: { name: { contains: search, mode: 'insensitive' } } }] }),
    };
    const views: Record<string, Prisma.ProductWhereInput> = {
      all: {}, active: { isAvailable: true, inventoryQty: { gt: 0 } },
      'low-stock': { inventoryQty: { gt: 0, lte: 10 } }, 'quote-only': { isPriceVisible: false },
      'missing-images': { images: { isEmpty: true } }, 'missing-type': { OR: [{ productType: null }, { productType: '' }] },
      hidden: { OR: [{ isAvailable: false }, { inventoryQty: { lte: 0 } }] },
    };
    const view = searchParams.get('view') || 'all';
    const where = paged ? { AND: [baseWhere, views[view] || views.all] } : baseWhere;
    let counts: Record<string, number> = {};
    let inventoryValue = 0;
    let page = requestedPage;
    if (paged) {
      // Counts are computed in the database; no catalog rows or media are hydrated.
      const clauses = [Prisma.sql`p."growerId" = ${user.growerId}`, Prisma.sql`p."isDeleted" = false`];
      if (strainId) clauses.push(Prisma.sql`p."strainId" = ${strainId}`);
      if (batchId) clauses.push(Prisma.sql`p."batchId" = ${batchId}`);
      if (productType) clauses.push(Prisma.sql`p."productType" = ${productType}`);
      if (isAvailable !== null) clauses.push(Prisma.sql`p."isAvailable" = ${isAvailable === 'true'}`);
      if (search) clauses.push(Prisma.sql`(p.name ILIKE ${`%${search}%`} OR EXISTS (SELECT 1 FROM strains s WHERE s.id = p."strainId" AND s.name ILIKE ${`%${search}%`}))`);
      const [stats] = await db.$queryRaw<Array<Record<string, bigint | Prisma.Decimal>>>(Prisma.sql`
        SELECT COUNT(*) AS "all", COUNT(*) FILTER (WHERE "isAvailable" AND "inventoryQty" > 0) AS active,
          COUNT(*) FILTER (WHERE "inventoryQty" > 0 AND "inventoryQty" <= 10) AS "low-stock",
          COUNT(*) FILTER (WHERE NOT "isPriceVisible") AS "quote-only",
          COUNT(*) FILTER (WHERE COALESCE(cardinality(images), 0) = 0) AS "missing-images",
          COUNT(*) FILTER (WHERE "productType" IS NULL OR "productType" = '') AS "missing-type",
          COUNT(*) FILTER (WHERE NOT "isAvailable" OR "inventoryQty" <= 0) AS hidden,
          COALESCE(SUM(price * "inventoryQty"), 0) AS "inventoryValue"
        FROM products p WHERE ${Prisma.join(clauses, ' AND ')}`);
      counts = Object.fromEntries(Object.keys(views).map(key => [key, Number(stats[key] || 0)]));
      inventoryValue = Number(stats.inventoryValue || 0);
      page = Math.min(requestedPage, Math.max(1, Math.ceil((counts[view] ?? counts.all) / pageSize)));
    }
    const products = await db.product.findMany({
      where,
      select: {
        id: true, name: true, productType: true, subType: true, strainId: true, batchId: true,
        price: true, inventoryQty: true, unit: true, isAvailable: true, isPriceVisible: true,
        status: true, createdAt: true,
        strain: { select: { id: true, name: true, genetics: true, strainType: true } },
        batch: { select: { id: true, batchNumber: true } },
      },
      ...(paged ? { skip: (page - 1) * pageSize, take: Math.floor(pageSize) } : {}),
      orderBy: [{ [sortBy]: sortOrder }, { id: 'asc' }],
    });
    const imageCounts = paged && products.length ? await db.$queryRaw<Array<{ id: string; imageCount: number }>>(Prisma.sql`
      SELECT id, COALESCE(cardinality(images), 0)::integer AS "imageCount" FROM products WHERE id IN (${Prisma.join(products.map(p => p.id))}) AND "growerId" = ${user.growerId}`) : [];
    const imagesById = new Map(imageCounts.map(row => [row.id, row.imageCount]));
    const summaries = products.map(product => ({ ...serializeProduct(product), imageCount: imagesById.get(product.id) || 0 }));
    return NextResponse.json(paged ? { products: summaries, page, pageSize, total: counts[view] ?? counts.all, counts, inventoryValue } : summaries);
  } catch (error) {
    logApiError('products.GET', error, { route: '/api/products' });
    return apiError(500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) return apiError(401, 'UNAUTHORIZED', 'Unauthorized');

    const user = session.user;
    if (user.role !== 'GROWER' || !user.growerId) {
      return apiError(403, 'FORBIDDEN', 'Forbidden');
    }

    const body = await request.json();
    const parsed = parseProductPayload(body, {
      partial: false,
      defaultStatus: PRODUCT_STATUS.PUBLISHED,
    });

    if (!parsed.ok) {
      return apiError(400, 'VALIDATION_ERROR', parsed.errors.join(', '), {
        details: parsed.errors,
      });
    }

    const data = parsed.data;
    if (data.images) data.images = await Promise.all(data.images.map(async (value) => (await persistMediaReference(value, `products/${user.growerId}/images`))!));
    if (data.ingredientsDocumentUrl) data.ingredientsDocumentUrl = await persistMediaReference(data.ingredientsDocumentUrl, `products/${user.growerId}/documents`) || null;

    const [growerPlan, listingCount] = await Promise.all([
      db.grower.findUnique({
        where: { id: user.growerId },
        select: { subscriptionPlan: true, subscriptionStatus: true },
      }),
      db.product.count({ where: { growerId: user.growerId, isDeleted: false } }),
    ]);
    if (!canCreateListings(growerPlan, listingCount)) {
      return apiError(402, 'PLAN_LIMIT_REACHED', FREE_LISTING_LIMIT_MESSAGE, {
        upgradeHref: '/grower/pricing',
      });
    }

    if (data.strainId) {
      const strain = await db.strain.findFirst({
        where: { id: data.strainId, growerId: user.growerId },
        select: { id: true },
      });
      if (!strain) return apiError(404, 'STRAIN_NOT_FOUND', 'Strain not found');
    }

    if (data.batchId) {
      const batch = await db.batch.findFirst({ where: { id: data.batchId, growerId: user.growerId } });
      if (!batch) return apiError(404, 'BATCH_NOT_FOUND', 'Batch not found');
    }

    const product = await db.product.create({
      data: {
        growerId: user.growerId,
        isDeleted: false,
        status: data.status,
        name: data.name || 'Untitled Draft Product',
        productType: data.productType,
        subType: data.subType,
        strainId: data.strainId,
        batchId: data.batchId,
        thcMin: data.thcMin,
        thcMax: data.thcMax,
        cbdMin: data.cbdMin,
        cbdMax: data.cbdMax,
        harvestDate: data.harvestDate ? new Date(data.harvestDate) : null,
        price: data.price ?? 0,
        inventoryQty: data.inventoryQty ?? 0,
        unit: data.unit || 'Gram',
        description: data.description,
        images: data.images || [],
        isAvailable: data.isAvailable,
        isPriceVisible: data.isPriceVisible,
        sku: data.sku,
        brand: data.brand,
        ingredients: data.ingredients,
        ingredientsDocumentUrl: data.ingredientsDocumentUrl,
        isFeatured: data.isFeatured,
      },
      include: {
        strain: { select: { id: true, name: true, genetics: true } },
        batch: { select: { id: true, batchNumber: true, harvestDate: true, thc: true, cbd: true, totalCannabinoids: true } },
      },
    });

    return NextResponse.json(serializeProduct(product), { status: 201 });
  } catch (error) {
    logApiError('products.POST', error, { route: '/api/products' });
    return apiError(500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
  }
}
