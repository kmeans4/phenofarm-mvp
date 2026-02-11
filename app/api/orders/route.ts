import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET all orders for the authenticated grower
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
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = { growerId: user.growerId };
    
    if (status) {
      where.status = status;
    }

    const orders = await db.order.findMany({
      where,
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        dispensary: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const total = await db.order.count({ where });

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, { status: 200 });
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
    if (!dispensaryId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields: dispensaryId and items array' }, { status: 400 });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      if (!item.productId || !item.quantity || !item.unitPrice) {
        return NextResponse.json({ error: `Invalid item: ${JSON.stringify(item)}` }, { status: 400 });
      }

      const product = await db.product.findUnique({
        where: { id: item.productId, growerId: user.growerId },
      });

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 404 });
      }

      if (product.inventoryQty < item.quantity) {
        return NextResponse.json({ error: `Insufficient inventory for ${product.name}` }, { status: 400 });
      }

      const itemTotal = parseFloat(item.unitPrice) * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        orderId: '', // Will be set after order creation
        productId: item.productId,
        growerId: user.growerId,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice),
        totalPrice: itemTotal,
      });
    }

    const tax = (subtotal * 0.06); // 6% tax rate
    const totalAmount = subtotal + tax + (shippingFee ? parseFloat(shippingFee) : 0);

    // Create the order
    const order = await db.order.create({
      data: {
        growerId: user.growerId,
        dispensaryId,
        status: 'PENDING',
        totalAmount,
        subtotal,
        tax,
        shippingFee: shippingFee ? parseFloat(shippingFee) : 0,
        notes: notes || null,
        items: {
          create: orderItems,
        },
      },
      include: {
        dispensary: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Update inventory
    for (const item of items) {
      await db.product.update({
        where: { id: item.productId, growerId: user.growerId },
        data: {
          inventoryQty: {
            decrement: item.quantity,
          },
        },
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
