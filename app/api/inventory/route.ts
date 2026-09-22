import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireGrower } from '@/lib/auth-helpers';

const inventorySelect = { id: true, name: true, productType: true, subType: true, inventoryQty: true, price: true, unit: true, isAvailable: true, status: true } as const;

export async function GET() {
  const auth = await requireGrower();
  if ('error' in auth) return auth.error;
  const products = await db.product.findMany({ where: { growerId: auth.growerId, isDeleted: false }, select: inventorySelect, orderBy: { name: 'asc' } });
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const auth = await requireGrower();
  if ('error' in auth) return auth.error;
  const body = await request.json().catch(() => null);
  const quantity = body?.quantityAvailable;
  if (typeof body?.productId !== 'string' || !Number.isInteger(quantity) || quantity < 0 || quantity > 1000000) {
    return NextResponse.json({ error: 'Product and a non-negative whole quantity are required' }, { status: 400 });
  }
  const product = await db.$transaction(async tx => {
    const existing = await tx.product.findFirst({ where: { id: body.productId, growerId: auth.growerId, isDeleted: false }, select: { id: true, inventoryQty: true, isAvailable: true, status: true, updatedAt: true } });
    if (!existing) return null;
    const result = await tx.product.updateMany({ where: { id: existing.id, updatedAt: existing.updatedAt }, data: { inventoryQty: quantity, isAvailable: existing.status === 'PUBLISHED' && quantity > 0 && (existing.inventoryQty === 0 || existing.isAvailable) } });
    if (!result.count) return 'conflict';
    return tx.product.findUnique({ where: { id: existing.id }, select: inventorySelect });
  });
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  if (product === 'conflict') return NextResponse.json({ error: 'Stock changed. Refresh and try again.' }, { status: 409 });
  return NextResponse.json(product, { status: 201 });
}
