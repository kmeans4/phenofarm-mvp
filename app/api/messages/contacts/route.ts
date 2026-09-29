import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { marketplaceGrowerWhere } from '@/lib/license';
export async function GET(request: NextRequest) {
  const session = await getAuthSession();
  const user = session?.user;
  if (!user || !['GROWER', 'DISPENSARY'].includes(user.role))
    return NextResponse.json(
      { error: 'Sign in to start a conversation.' },
      { status: 403 }
    );
  const q = (request.nextUrl.searchParams.get('q') || '').slice(0, 200);
  const contacts =
    user.role === 'GROWER'
      ? await db.dispensary.findMany({
          where: {
            isOffPlatform: false,
            userId: { not: null },
            businessName: { contains: q, mode: 'insensitive' },
          },
          select: { id: true, businessName: true },
          orderBy: { businessName: 'asc' },
          take: 30,
        })
      : await db.grower.findMany({
          where: {
            ...marketplaceGrowerWhere(),
            businessName: { contains: q, mode: 'insensitive' },
          },
          select: { id: true, businessName: true },
          orderBy: { businessName: 'asc' },
          take: 30,
        });
  return NextResponse.json({ contacts });
}
