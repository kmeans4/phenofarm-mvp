import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import { Prisma } from '@prisma/client';
import { parseProductPayload, PRODUCT_STATUS } from '@/lib/product-payload';

function serializeProduct(product: any) {
  return {
    ...product,
    price: product.price ? parseFloat(String(product.price)) : 0,
    thcLegacy: product.thcLegacy ? parseFloat(String(product.thcLegacy)) : null,
    cbdLegacy: product.cbdLegacy ? parseFloat(String(product.cbdLegacy)) : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user;
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const productType = searchParams.get('productType');
    const strainId = searchParams.get('strainId');
    const batchId = searchParams.get('batchId');
    const isAvailable = searchParams.get('isAvailable');
    const status = searchParams.get('status');
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
      ...(status && { status: status as any }),
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
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user;
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = parseProductPayload(body, {
      partial: false,
      defaultStatus: PRODUCT_STATUS.PUBLISHED,
    });

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.errors.join(', ') }, { status: 400 });
    }

    const data = parsed.data;

    if (data.strainId) {
      const strain = await db.strain.findFirst({ where: { id: data.strainId, growerId: user.growerId } });
      if (!strain) return NextResponse.json({ error: 'Strain not found' }, { status: 404 });
    }

    if (data.batchId) {
      const batch = await db.batch.findFirst({ where: { id: data.batchId, growerId: user.growerId } });
      if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
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
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
error' }, { status: 500 });
  }
}
