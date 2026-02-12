import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { Prisma, OrderStatus } from '@prisma/client';
import { format } from 'date-fns';

// GET all orders for the authenticated grower with filtering and CSV export
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as OrderStatus | null;
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const exportFormat = searchParams.get('export');

    const where: Prisma.OrderWhereInput = {
      growerId: user.growerId,
      ...(status && { status: { equals: status } }),
      ...(search && {
        OR: [
          { orderId: { contains: search, mode: 'insensitive' } },
          { dispensary: { businessName: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const orders = await db.order.findMany({
      where,
      include: {
        dispensary: {
          select: {
            businessName: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    } as any);

    // Handle CSV export request
    if (exportFormat === 'csv') {
      const headers = ['Order ID', 'Dispensary', 'Status', 'Total Amount', 'Created At'];
      const rows = orders.map((order: any) => [
        `"${order.orderId}"`,
        `"${order.dispensary.businessName}"`,
        `"${order.status}"`,
        `"${order.totalAmount.toString()}"`,
        `"${format(order.createdAt, 'yyyy-MM-dd HH:mm:ss')}"`,
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.join(','))
      ].join('\n');
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=orders_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`,
        },
      });
    }

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create a new order
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
    const { dispensaryId, items, notes, shippingFee } = body;

    // Validate required fields
    if (!dispensaryId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: dispensaryId, items (array)' },
        { status: 400 }
      );
    }

    // Verify dispensary belongs to another user (not this grower)
    const dispensary = await db.dispensary.findUnique({
      where: { id: dispensaryId },
    });

    if (!dispensary) {
      return NextResponse.json({ error: 'Invalid dispensary' }, { status: 400 });
    }

    // Calculate subtotal and validate inventory
    let subtotal = 0;
    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }

      if (product.inventoryQty < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient inventory for ${product.name}. Available: ${product.inventoryQty}` },
          { status: 400 }
        );
      }

      // Deduct inventory
      await db.product.update({
        where: { id: item.productId },
        data: { inventoryQty: { decrement: item.quantity } },
      });

      // Calculate item total
      const itemTotal = item.quantity * item.unitPrice;
      subtotal += itemTotal;
    }

    // Calculate tax (6% for Vermont)
    const tax = subtotal * 0.06;

    // Create the order
    const order = await db.order.create({
      data: {
        growerId: user.growerId,
        dispensaryId,
        orderId: `ORD-${Date.now()}`,
        status: 'PENDING',
        totalAmount: subtotal + tax + (shippingFee || 0),
        subtotal,
        tax,
        shippingFee: shippingFee || 0,
        notes: notes || null,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            growerId: user.growerId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        dispensary: {
          select: {
            businessName: true,
          },
        },
        items: true,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update order status
export async function PUT(request: NextRequest) {
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
    const { orderId, status } = body;

    // Validate required fields
    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, status' },
        { status: 400 }
      );
    }

    // Validate status
    if (!Object.values(OrderStatus).includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${Object.values(OrderStatus).join(', ')}` },
        { status: 400 }
      );
    }

    // Find the order and verify it belongs to this grower
    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.growerId !== user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update order status
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

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
