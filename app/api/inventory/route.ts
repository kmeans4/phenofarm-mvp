import { validQuantity, QUANTITY_MESSAGE } from '@/lib/quantity';
import { plainData } from '@/lib/serialize';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireGrower } from '@/lib/auth-helpers';

const inventorySelect = {
  id: true,
  name: true,
  productType: true,
  subType: true,
  inventoryQty: true,
  price: true,
  unit: true,
  isAvailable: true,
  status: true,
} as const;

export async function GET() {
  const auth = await requireGrower();
  if ('error' in auth) return auth.error;
  const products = await db.product.findMany({
    where: { growerId: auth.growerId, isDeleted: false },
    select: inventorySelect,
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(plainData(products));
}

export async function POST(request: NextRequest) {
  const auth = await requireGrower();
  if ('error' in auth) return auth.error;
  const body = await request.json().catch(() => null);
  const quantity = body?.quantityAvailable;
  if (
    typeof body?.productId !== 'string' ||
    !validQuantity(quantity, { allowZero: true, allowUnknownUnit: true }) ||
    quantity < 0 ||
    quantity > 1000000
  ) {
    return NextResponse.json({ error: QUANTITY_MESSAGE }, { status: 400 });
  }
  const product = await db.$transaction(async (tx) => {
    const existing = await tx.product.findFirst({
      where: { id: body.productId, growerId: auth.growerId, isDeleted: false },
      select: {
        id: true,
        inventoryQty: true,
        unit: true,
        productType: true,
        isAvailable: true,
        status: true,
        updatedAt: true,
      },
    });
    if (!existing) return null;
    if (
      !validQuantity(quantity, {
        unit: existing.unit,
        productType: existing.productType,
        allowZero: true,
      })
    )
      return 'invalid';
    if (
      typeof body.expectedQuantity === 'number' &&
      body.expectedQuantity !== Number(existing.inventoryQty)
    )
      return 'conflict';
    const result = await tx.product.updateMany({
      where: { id: existing.id, updatedAt: existing.updatedAt },
      data: {
        inventoryQty: quantity,
        isAvailable:
          existing.status === 'PUBLISHED' &&
          quantity > 0 &&
          (Number(existing.inventoryQty) === 0 || existing.isAvailable),
      },
    });
    if (!result.count) return 'conflict';
    return tx.product.findUnique({
      where: { id: existing.id },
      select: inventorySelect,
    });
  });
  if (!product)
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  if (product === 'invalid')
    return NextResponse.json({ error: QUANTITY_MESSAGE }, { status: 400 });
  if (product === 'conflict')
    return NextResponse.json(
      { error: 'Stock changed. Refresh and try again.' },
      { status: 409 }
    );
  return NextResponse.json(plainData(product), { status: 201 });
}
