import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = (await getAuthSession())?.user;
  if (!user || !['GROWER', 'DISPENSARY'].includes(user.role))
    return NextResponse.json({ error: 'Sign in required.' }, { status: 403 });
  const { id } = await params;
  const conversation = await db.conversation.findFirst({
    where: {
      id,
      ...(user.role === 'GROWER'
        ? { growerId: user.growerId || '' }
        : { dispensaryId: user.dispensaryId || '' }),
    },
  });
  if (!conversation)
    return NextResponse.json(
      { error: 'Conversation not found.' },
      { status: 404 }
    );
  const q = (request.nextUrl.searchParams.get('q') || '').slice(0, 200);
  const selectedId = (request.nextUrl.searchParams.get('selected') || '').slice(
    0,
    100
  );
  const where: Prisma.ProductWhereInput = {
    growerId: conversation.growerId,
    isDeleted: false,
    ...(user.role === 'DISPENSARY'
      ? { status: 'PUBLISHED', isAvailable: true }
      : {}),
  };
  const select = {
    id: true,
    name: true,
    unit: true,
    price: true,
    isPriceVisible: true,
    inventoryQty: true,
  } as const;
  const [products, selected] = await Promise.all([
    db.product.findMany({
      where: { ...where, name: { contains: q, mode: 'insensitive' } },
      select,
      orderBy: { name: 'asc' },
      take: 50,
    }),
    selectedId
      ? db.product.findFirst({ where: { ...where, id: selectedId }, select })
      : null,
  ]);
  const result =
    selected && !products.some((product) => product.id === selected.id)
      ? [selected, ...products]
      : products;
  return NextResponse.json({
    products: result.map((product) => ({
      ...product,
      price:
        user.role === 'GROWER' || product.isPriceVisible
          ? Number(product.price)
          : null,
    })),
  });
}
