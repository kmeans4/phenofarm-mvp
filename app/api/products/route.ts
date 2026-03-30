import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import { Prisma } from '@prisma/client';
import { parseProductPayload, PRODUCT_STATUS } from '@/lib/product-payload';
import { apiError, logApiError } from '@/lib/api-response';

type ProductLike = {
  price: Prisma.Decimal | number | null;
  isPriceVisible?: boolean | null;
  thcLegacy?: Prisma.Decimal | number | null;
  cbdLegacy?: Prisma.Decimal | number | null;
};

function serializeProduct<T extends ProductLike>(product: T) {
  return {
    ...product,
    price: product.price ? parseFloat(String(product.price)) : 0,
    isPriceVisible: product.isPriceVisible ?? true,
    thcLegacy: product.thcLegacy ? parseFloat(String(product.thcLegacy)) : null,
    cbdLegacy: product.cbdLegacy ? parseFloat(String(product.cbdLegacy)) : null,
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
