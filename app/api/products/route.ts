import { getGrowerProductPage, serializeProduct } from '@/lib/grower-products';
import { persistMediaReference } from '@/lib/blob-storage';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import { parseProductPayload, PRODUCT_STATUS } from '@/lib/product-payload';
import { apiError, logApiError } from '@/lib/api-response';
import { canCreateListings, FREE_LISTING_LIMIT_MESSAGE } from '@/lib/plans';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return apiError(401, 'UNAUTHORIZED', 'Unauthorized');
    const user = session.user;
    if (user.role !== 'GROWER' || !user.growerId) return apiError(403, 'FORBIDDEN', 'Forbidden');

    return NextResponse.json(await getGrowerProductPage(user.growerId, new URL(request.url).searchParams));
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
