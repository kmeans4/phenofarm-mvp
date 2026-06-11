import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import { toSafeBoolean, toSafeProductType, toSafeUnit } from '@/lib/product-serializers';

type BulkUpdateBody = {
  productIds?: unknown;
  updates?: {
    isAvailable?: unknown;
    isPriceVisible?: unknown;
    unit?: unknown;
    productType?: unknown;
  };
};

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user;
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as BulkUpdateBody;
    const productIds = Array.isArray(body.productIds)
      ? body.productIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
      : [];

    if (productIds.length === 0) {
      return NextResponse.json({ error: 'Choose at least one product to update' }, { status: 400 });
    }

    if (productIds.length > 100) {
      return NextResponse.json({ error: 'Bulk updates are limited to 100 products at a time' }, { status: 400 });
    }

    const updates = body.updates || {};
    const hasSupportedUpdate =
      updates.isAvailable !== undefined ||
      updates.isPriceVisible !== undefined ||
      updates.unit !== undefined ||
      updates.productType !== undefined;

    if (!hasSupportedUpdate) {
      return NextResponse.json({ error: 'No supported update fields provided' }, { status: 400 });
    }

    const products = await db.product.findMany({
      where: {
        id: { in: productIds },
        growerId: user.growerId,
        isDeleted: false,
      },
      select: { id: true, inventoryQty: true },
    });

    if (products.length === 0) {
      return NextResponse.json({ error: 'No matching products found' }, { status: 404 });
    }

    const transactions = products.map((product) => {
      const data: Prisma.ProductUncheckedUpdateInput = {};

      if (updates.isAvailable !== undefined) {
        data.isAvailable = product.inventoryQty > 0 ? toSafeBoolean(updates.isAvailable, false) : false;
      }

      if (updates.isPriceVisible !== undefined) {
        data.isPriceVisible = toSafeBoolean(updates.isPriceVisible, true);
      }

      if (updates.unit !== undefined) {
        data.unit = toSafeUnit(updates.unit);
      }

      if (updates.productType !== undefined) {
        data.productType = toSafeProductType(updates.productType, null);
      }

      return db.product.update({
        where: { id: product.id },
        data,
      });
    });

    await db.$transaction(transactions);

    return NextResponse.json({
      success: true,
      updatedCount: products.length,
      skippedCount: productIds.length - products.length,
    });
  } catch (error) {
    console.error('Error bulk updating products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
