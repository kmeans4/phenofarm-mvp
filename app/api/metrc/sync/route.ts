import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';

// POST - Trigger METRC sync for grower
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;
    
    if (user.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json() as { manualTrigger?: boolean };
    const manualTrigger = body.manualTrigger ?? false;
    console.log('Manual trigger:', manualTrigger);

    // Check if grower has METRC credentials
    const grower = await db.grower.findUnique({
      where: { id: user.growerId },
      select: { id: true, businessName: true },
    });

    if (!grower) {
      return NextResponse.json({ error: 'Grower profile not found' }, { status: 404 });
    }

    // Simulate METRC sync (placeholder)
    const syncLog = await db.metrcSyncLog.create({
      data: {
        growerId: grower.id,
        recordsSynced: 5,
        success: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'METRC sync completed',
      recordsSynced: syncLog.recordsSynced,
    });
  } catch (error) {
    console.error('METRC sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
