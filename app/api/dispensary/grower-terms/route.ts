import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { DEFAULT_COMMERCIAL_TERMS } from '@/lib/ux-workflow';

function normalizeIds(value: string | null) {
  if (!value) return [];
  return Array.from(new Set(value.split(',').map((id) => id.trim()).filter(Boolean))).slice(0, 25);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    if (user.role !== 'DISPENSARY' || !user.dispensaryId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const growerIds = normalizeIds(searchParams.get('ids'));

    if (growerIds.length === 0) {
      return NextResponse.json({ terms: [] });
    }

    const growers = await db.grower.findMany({
      where: { id: { in: growerIds } },
      select: {
        id: true,
        commercialFulfillmentRegion: true,
        commercialPaymentTerms: true,
      },
    });

    return NextResponse.json({
      terms: growers.map((grower) => ({
        growerId: grower.id,
        fulfillmentRegion: grower.commercialFulfillmentRegion || DEFAULT_COMMERCIAL_TERMS.fulfillmentRegion,
        paymentTerms: grower.commercialPaymentTerms || DEFAULT_COMMERCIAL_TERMS.paymentTerms,
      })),
    });
  } catch (error) {
    console.error('Error loading grower commercial terms:', error);
    return NextResponse.json({ error: 'Failed to load grower terms' }, { status: 500 });
  }
}
