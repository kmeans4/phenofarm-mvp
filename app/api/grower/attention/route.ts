import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { getGrowerAttentionSummary } from '@/lib/grower-attention';

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;

    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const summary = await getGrowerAttentionSummary({
      growerId: user.growerId,
      userId: user.id,
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error loading grower attention summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
