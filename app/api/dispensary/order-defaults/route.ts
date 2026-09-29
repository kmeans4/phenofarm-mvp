import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { normalizeOrderDefaults } from '@/lib/buyer-defaults';
export async function PUT(request: Request) {
  const session = await getAuthSession();
  if (session?.user.role !== 'DISPENSARY' || !session.user.dispensaryId)
    return NextResponse.json(
      { error: 'Please sign in as a dispensary.' },
      { status: 401 }
    );
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return NextResponse.json({ error: 'Invalid defaults.' }, { status: 400 });
  const defaults = normalizeOrderDefaults(body);
  await db.dispensary.update({
    where: { id: session.user.dispensaryId },
    data: { orderDefaults: defaults },
  });
  return NextResponse.json({ orderDefaults: defaults });
}
