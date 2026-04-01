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

type ProductLike = {
  name?: string | null;
  productType?: string | null;
  subType?: string | null;
  categoryLegacy?: string | null;
  subcategoryLegacy?: string | null;
  strainLegacy?: string | null;
  price: Prisma.Decimal | number | null;
  inventoryQty?: number | null;
  unit?: string | null;
  isAvailable?: boolean | null;
  isPriceVisible?: boolean | null;
  images?: string[] | null;
  thcLegacy?: Prisma.Decimal | number | null;
  cbdLegacy?: Prisma.Decimal | number | null;
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
    productType: toSafeProductType(product.productType, product.categoryLegacy),
    subType: toSafeOptionalString(product.subType),
    categoryLegacy: toSafeOptionalString(product.categoryLegacy),
    subcategoryLegacy: toSafeOptionalString(product.subcategoryLegacy),
    strainLegacy: toSafeOptionalString(product.strainLegacy),
    price: toSafeNonNegativeNumber(product.price, 0),
    inventoryQty,
    unit: toSafeUnit(product.unit),
    isAvailable: toSafeAvailability(product.isAvailable, inventoryQty),
    isPriceVisible: toSafeBoolean(product.isPriceVisible, true),
    images: toSafeStringArray(product.images),
    thcLegacy: toSafeOptionalNumber(product.thcLegacy),
    cbdLegacy: toSafeOptionalNumber(product.cbdLegacy),
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
    if (user.role !== 'GROWER' || !user.growerId) {
      return apiError(403, 'FORBIDDEN', 'Forbidden');
    }

    const { searchParams } = new URL(request.url);
    const productType = searchParams.get('productType');
    const strainId = searchParams.get('strainId');
    const batchId = searchParams.get('batchId');
    const isAvailable = searchParams.get('isAvailable');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Prisma.ProductWhereInput = {
      growerId: user.growerId,
      isDeleted: false,
      ...(productType && { productType }),
      ...(strainId && { strainId }),
      ...(batchId && { batchId }),
      ...(isAvailable !== null && { isAvailable: isAvailable === 'true' }),
      // NOTE: status filtering disabled for DB compatibility until ProductStatus migration is guaranteed applied.
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { strainLegacy: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const products = await db.product.findMany({
      where,
      include: {
        strain: { select: { id: true, name: true, genetics: true } },
        batch: {
          select: {
            id: true,
            batchNumber: true,
            harvestDate: true,
            thc: true,
            cbd: true,
            totalCannabinoids: true,
            terpenes: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
    });

    return NextResponse.json(products.map(serializeProduct), { status: 200 });
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
        // status intentionally omitted until ProductStatus migration is guaranteed applied
        name: data.name || 'Untitled Draft Product',
        productType: data.productType,
        subType: data.subType,
        strainId: data.strainId,
        batchId: data.batchId,
        strainLegacy: data.strainLegacy,
        categoryLegacy: data.categoryLegacy,
        subcategoryLegacy: data.subcategoryLegacy,
        thcLegacy: data.thcLegacy,
        cbdLegacy: data.cbdLegacy,
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
