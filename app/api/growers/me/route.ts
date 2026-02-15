import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';

// GET current grower's profile
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const grower = await db.grower.findUnique({
      where: { id: user.growerId },
      select: {
        id: true,
        businessName: true,
        licenseNumber: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        website: true,
        description: true,
        logo: true,
        contactName: true,
        isVerified: true,
      },
    });

    if (!grower) {
      return NextResponse.json({ error: 'Grower not found' }, { status: 404 });
    }

    return NextResponse.json(grower, { status: 200 });
  } catch (error) {
    console.error('Error fetching grower:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
