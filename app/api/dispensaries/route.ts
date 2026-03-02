import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dispensaries = await db.dispensary.findMany({
      select: {
        id: true,
        businessName: true,
        city: true,
        state: true,
        address: true,
      },
    });

    return NextResponse.json(dispensaries, { status: 200 });
  } catch (error) {
    console.error('Error fetching dispensaries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
