import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { ExtendedUser } from '@/types';

const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = (session as any).user as ExtendedUser;

  if (user.role !== 'GROWER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('skip') || '0');

    const where: any = { growerId: user.growerId };

    if (status && validStatuses.includes(status)) {
      where.status = status;
    }

    const orders = await db.order.findMany({
      where,
      include: {
        dispensary: {
          select: {
            businessName: true,
            logo: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                strain: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    const total = await db.order.count({ where });

    return NextResponse.json({
      orders,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Orders Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = (session as any).user as ExtendedUser;

  if (user.role !== 'GROWER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, status' },
        { status: 400 }
      );
    }

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify order belongs to this grower
    const order = await db.order.findFirst({
      where: {
        id: orderId,
        growerId: user.growerId,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update status
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        dispensary: {
          select: {
            businessName: true,
          },
        },
      },
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error('Update Order Error:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
