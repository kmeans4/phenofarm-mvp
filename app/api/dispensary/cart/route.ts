import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { normalizeCart } from '@/lib/cart';

async function buyer() {
  const session = await getAuthSession();
  return session?.user.role === 'DISPENSARY' ? session.user.dispensaryId : null;
}
export async function GET() {
  const id = await buyer();
  if (!id)
    return NextResponse.json(
      { error: 'Please sign in as a dispensary.' },
      { status: 401 }
    );
  const row = await db.dispensary.findUnique({
    where: { id },
    select: { cart: true },
  });
  return NextResponse.json({ cart: normalizeCart(row?.cart) });
}
export async function PATCH(request: Request) {
  const id = await buyer();
  if (!id)
    return NextResponse.json(
      { error: 'Please sign in as a dispensary.' },
      { status: 401 }
    );
  const body = await request.json().catch(() => null);
  if (
    !Array.isArray(body?.changed) ||
    !Array.isArray(body?.removed) ||
    body.changed.length > 200 ||
    body.removed.length > 200
  )
    return NextResponse.json(
      { error: 'Invalid cart update.' },
      { status: 400 }
    );
  const changed = normalizeCart({ items: body.changed }).items;
  const removed = new Set(
    body.removed.filter((value: unknown) => typeof value === 'string')
  );
  const cart = await db.$transaction(async (tx) => {
    await tx.$queryRaw(
      Prisma.sql`SELECT id FROM dispensaries WHERE id = ${id} FOR UPDATE`
    );
    const row = await tx.dispensary.findUniqueOrThrow({
      where: { id },
      select: { cart: true },
    });
    const items = new Map(
      normalizeCart(row.cart)
        .items.filter((item) => !removed.has(item.id))
        .map((item) => [item.id, item])
    );
    changed.forEach((item) => items.set(item.id, item));
    const next = normalizeCart({ items: [...items.values()] });
    await tx.dispensary.update({
      where: { id },
      data: { cart: JSON.parse(JSON.stringify(next)) },
    });
    return next;
  });
  return NextResponse.json({ cart });
}
