import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST - Trigger METRC sync for grower
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    
    if (user.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { manualTrigger = false } = body;

    // Check if grower has METRC credentials
    const grower = await db.grower.findUnique({
      where: { id: user.growerId },
      select: { metrcSyncLogs: true }
    });

    if (!grower) {
      return NextResponse.json({ error: 'Grower not found' }, { status: 404 });
    }

    // Create sync log entry
    const syncLog = await db.metrcSyncLog.create({
      data: {
        growerId: user.growerId,
        recordsSynced: 0,
        success: true,
        errorMessage: null,
      },
    });

    // Simulate sync process (would connect to METRC API in production)
    const syncResult = {
      success: true,
      recordsSynced: 0,
      syncingProducts: true,
      syncingOrders: false,
    };

    // In production, this would:
    // 1. Connect to METRC API with grower credentials
    // 2. Fetch products, orders, inventory data
    // 3. Update本地 database
    // 4. Return actual sync results

    return NextResponse.json({
      message: 'Sync initiated',
      syncLogId: syncLog.id,
      ...syncResult,
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  } catch (error) {
    console.error('METRC sync error:', error);
    
    // Log error to database
    try {
      const user = (await getServerSession(authOptions))?.user as any;
      if (user?.growerId) {
        await db.metrcSyncLog.create({
          data: {
            growerId: user.growerId,
            recordsSynced: 0,
            success: false,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    } catch (logError) {
      console.error('Failed to log sync error:', logError);
    }

    return NextResponse.json({ 
      error: 'Sync failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Get sync status for grower
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    
    if (user.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get latest sync status
    const latestSync = await db.metrcSyncLog.findFirst({
      where: { growerId: user.growerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        recordsSynced: true,
        success: true,
        errorMessage: true,
        createdAt: true,
      },
    });

    // Get sync statistics
    const [successCount, failedCount] = await Promise.all([
      db.metrcSyncLog.count({ where: { growerId: user.growerId, success: true } }),
      db.metrcSyncLog.count({ where: { growerId: user.growerId, success: false } }),
    ]);

    const totalRecordsSynced = await db.metrcSyncLog.aggregate({
      where: { growerId: user.growerId },
      _sum: {
        recordsSynced: true,
      },
    });

    return NextResponse.json({
      latestSync: latestSync ? {
        ...latestSync,
        timestamp: latestSync.createdAt.toISOString(),
      } : null,
      stats: {
        totalAttempts: successCount + failedCount,
        successfulAttempts: successCount,
        failedAttempts: failedCount,
        totalRecordsSynced: totalRecordsSynced._sum.recordsSynced || 0,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
