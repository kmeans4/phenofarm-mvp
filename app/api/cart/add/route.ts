import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    
    if (user.role !== 'DISPENSARY') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const productId = formData.get('productId') as string;
    const quantity = parseInt(formData.get('quantity') as string) || 1;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Get product details
    const product = await db.product.findUnique({
      where: { id: productId },
      include: { grower: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!product.isAvailable || product.inventoryQty < quantity) {
      return NextResponse.json({ error: 'Product not available' }, { status: 400 });
    }
    
    // Redirect back with success
    return NextResponse.redirect(new URL('/dispensary/catalog?added=true', request.url));
    
  } catch (error) {
    console.error('Cart add error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
