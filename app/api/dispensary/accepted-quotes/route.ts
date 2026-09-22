import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user;
  if (user.role !== 'DISPENSARY' || !user.dispensaryId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const quotes = await db.acceptedQuote.findMany({
    where: { dispensaryId: user.dispensaryId, consumedByOrderId: null, expiresAt: { gt: new Date() } },
    orderBy: { acceptedAt: 'desc' },
    distinct: ['productId'],
    select: { id: true, productId: true, growerId: true, quantity: true, unitPrice: true, acceptedAt: true, expiresAt: true },
  });
  return NextResponse.json({ quotes: quotes.map((quote) => ({ ...quote, unitPrice: Number(quote.unitPrice) })) });
}
