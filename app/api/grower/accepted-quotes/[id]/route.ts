import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session || session.user.role !== 'GROWER' || !session.user.growerId)
    return NextResponse.json(
      { error: 'Please sign in as a grower.' },
      { status: 403 }
    );
  const { id } = await params;
  const quote = await db.acceptedQuote.findFirst({
    where: {
      id,
      growerId: session.user.growerId,
      consumedByOrderId: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          unit: true,
          price: true,
          inventoryQty: true,
        },
      },
      dispensary: { select: { id: true, businessName: true } },
    },
  });
  if (!quote)
    return NextResponse.json(
      { error: 'This quote has expired or is already used.' },
      { status: 404 }
    );
  return NextResponse.json(quote);
}
