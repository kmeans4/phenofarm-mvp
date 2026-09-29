import { refreshProductPriceAlerts } from '@/lib/buyer-alerts';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireGrower } from '@/lib/auth-helpers';
import {
  normalizeUnit,
  parsePrice,
  parseProductNumber,
} from '@/lib/product-payload';
import {
  canonicalizeProductType,
  isKnownProductType,
} from '@/lib/product-types';

export async function PATCH(request: NextRequest) {
  const auth = await requireGrower();
  if ('error' in auth) return auth.error;
  try {
    const body = await request.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body.productIds)
      ? ([
          ...new Set(
            body.productIds.filter(
              (id: unknown): id is string =>
                typeof id === 'string' && id.length > 0
            )
          ),
        ] as string[])
      : [];
    if (!ids.length || ids.length > 100)
      return NextResponse.json(
        { error: 'Choose between 1 and 100 products.' },
        { status: 400 }
      );
    const updates = body.updates || {};
    if (
      ![
        'isAvailable',
        'isPriceVisible',
        'unit',
        'productType',
        'price',
        'pricePercent',
        'soldOut',
      ].some((key) => updates[key] !== undefined)
    )
      return NextResponse.json({ error: 'Choose an update.' }, { status: 400 });
    const price =
      updates.price === undefined ? undefined : parsePrice(updates.price);
    const percent =
      updates.pricePercent === undefined
        ? undefined
        : parseProductNumber(updates.pricePercent);
    if (
      price === null ||
      percent === null ||
      (typeof percent === 'number' && (percent < -100 || percent > 10000))
    )
      return NextResponse.json(
        { error: 'Enter a valid price or percentage (at least −100%).' },
        { status: 400 }
      );
    if (updates.unit !== undefined && !normalizeUnit(updates.unit))
      return NextResponse.json(
        { error: 'Choose a supported unit.' },
        { status: 400 }
      );
    if (
      updates.productType !== undefined &&
      !isKnownProductType(updates.productType)
    )
      return NextResponse.json(
        { error: 'Choose a supported type.' },
        { status: 400 }
      );
    for (const key of ['isAvailable', 'isPriceVisible', 'soldOut'])
      if (updates[key] !== undefined && typeof updates[key] !== 'boolean')
        return NextResponse.json(
          { error: 'Invalid selection.' },
          { status: 400 }
        );
    const products = await db.product.findMany({
      where: { id: { in: ids }, growerId: auth.growerId, isDeleted: false },
      select: {
        id: true,
        inventoryQty: true,
        status: true,
        price: true,
        isAvailable: true,
        isPriceVisible: true,
        unit: true,
        productType: true,
      },
    });
    const skipped: Array<{ id: string; reason: string }> = ids
      .filter((id) => !products.some((product) => product.id === id))
      .map((id) => ({ id, reason: 'not found' }));
    const changed = products.filter((product) => {
      if (
        updates.isAvailable === true &&
        (product.inventoryQty <= 0 || product.status === 'DRAFT')
      ) {
        skipped.push({
          id: product.id,
          reason: product.status === 'DRAFT' ? 'draft' : 'no stock',
        });
        return false;
      }
      return true;
    });
    const nextPrices = changed.map(
      (product) =>
        price ??
        (percent === undefined
          ? Number(product.price)
          : Math.round(Number(product.price) * (1 + percent / 100) * 100) / 100)
    );
    if (nextPrices.some((value) => value > 999999.99))
      return NextResponse.json(
        { error: 'A resulting price exceeds $999,999.99.' },
        { status: 400 }
      );
    await db.$transaction(
      changed.map((product, index) => {
        const data: Prisma.ProductUncheckedUpdateInput = {};
        if (updates.isAvailable !== undefined)
          data.isAvailable = updates.isAvailable;
        if (updates.isPriceVisible !== undefined)
          data.isPriceVisible = updates.isPriceVisible;
        if (updates.unit !== undefined)
          data.unit = normalizeUnit(updates.unit)!;
        if (updates.productType !== undefined)
          data.productType = canonicalizeProductType(updates.productType);
        if (price !== undefined || percent !== undefined)
          data.price = nextPrices[index];
        if (updates.soldOut === true) {
          data.inventoryQty = 0;
          data.isAvailable = false;
        }
        return db.product.update({ where: { id: product.id }, data });
      })
    );
    if (price !== undefined || percent !== undefined)
      await Promise.all(
        changed.map((product) =>
          refreshProductPriceAlerts(product.id).catch((error) =>
            console.error('Price alert refresh failed:', error)
          )
        )
      );
    return NextResponse.json({
      success: true,
      updatedCount: changed.length,
      updatedIds: changed.map((product) => product.id),
      skippedCount: skipped.length,
      skipped,
      previous: changed.map((product) => ({
        ...product,
        price: Number(product.price),
      })),
    });
  } catch (error) {
    console.error('Product bulk update failed:', error);
    return NextResponse.json(
      { error: 'Could not update products. Try again.' },
      { status: 500 }
    );
  }
}
