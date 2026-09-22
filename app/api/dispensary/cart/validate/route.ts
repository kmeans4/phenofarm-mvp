import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { buyerProductWhere, normalizeProductIds } from '@/lib/buyer-products';

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'DISPENSARY' || !session.user.dispensaryId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.productIds) || body.productIds.length > 200) return NextResponse.json({ error: 'Provide at most 200 product IDs.' }, { status: 400 });
  const ids = normalizeProductIds(body.productIds);
  const products = await db.product.findMany({
    where: { id: { in: ids }, ...buyerProductWhere() },
    select: { id: true, price: true, isPriceVisible: true, inventoryQty: true, isAvailable: true },
  });
  const byId = new Map(products.map(product => [product.id, product]));
  return NextResponse.json({ products: ids.map(id => {
    const product = byId.get(id);
    return { id, price: product?.isPriceVisible ? Number(product.price) : null,
      isPriceVisible: product?.isPriceVisible ?? false,
      inventoryQty: product?.inventoryQty ?? 0,
      isAvailable: Boolean(product?.isAvailable && product.inventoryQty > 0) };
  }) });
}
