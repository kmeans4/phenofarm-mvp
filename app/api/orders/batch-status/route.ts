import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { OrderStatus } from '@prisma/client';

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = (session as any).user as { role: string; growerId?: string };

    if (user.role !== 'GROWER') {
      return NextResponse.json(
        { error: 'Forbidden - Grower access only' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { orderIds, status } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'orderIds array is required' },
        { status: 400 }
      );
    }

    if (!status || typeof status !== 'string') {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      );
    }

    const validStatuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status as OrderStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const growerId = user.growerId;
    if (!growerId) {
      return NextResponse.json(
        { error: 'Grower ID not found' },
        { status: 400 }
      );
    }

    // Verify all orders belong to this grower
    const orders = await db.order.findMany({
      where: {
        id: { in: orderIds },
        growerId: growerId,
      },
      select: { id: true, status: true },
    });

    if (orders.length !== orderIds.length) {
      return NextResponse.json(
        { error: 'Some orders not found or do not belong to you' },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: { status: OrderStatus; shippedAt?: Date | null; deliveredAt?: Date | null } = { 
      status: status as OrderStatus 
    };
    
    // Set timestamps based on status
    if (status === 'SHIPPED') {
      updateData.shippedAt = new Date();
    } else if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    const result = await db.order.updateMany({
      where: {
        id: { in: orderIds },
        growerId: growerId,
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      status: status,
    });

  } catch (error) {
    console.error('Batch status update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
