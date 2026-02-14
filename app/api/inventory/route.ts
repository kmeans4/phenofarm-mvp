import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface SessionUser {
  role: string;
  growerId?: string;
}

// GET inventory for the authenticated grower
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as SessionUser;
    
    if (user.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get products with their inventory info for this grower
    const products = await db.product.findMany({
      where: { growerId: user.growerId },
      include: {
        grower: true,
      },
    });

    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST add to inventory (update product quantity)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as SessionUser;
    
    if (user.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { productId, quantityAvailable } = body;

    if (!productId || !quantityAvailable) {
      return NextResponse.json({ error: 'Product and quantity are required' }, { status: 400 });
    }

    // Update the product inventory
    const product = await db.product.update({
      where: { 
        id: productId,
        growerId: user.growerId,
      },
      data: {
        inventoryQty: parseInt(quantityAvailable) || 0,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error adding inventory:', error);
    return NextResponse.json({ error: 'Failed to add inventory' }, { status: 500 });
  }
}
