import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Product } from '@prisma/client';

// GET a single product by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    
    if (user.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const productId = (await context.params).id;

    const product = await db.product.findFirst({
      where: {
        id: productId,
        growerId: user.growerId,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update a product
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    
    if (user.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const productId = (await context.params).id;

    // Check if product exists and belongs to grower
    const existingProduct = await db.product.findFirst({
      where: {
        id: productId,
        growerId: user.growerId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      strain,
      category,
      subcategory,
      thc,
      cbd,
      price,
      inventoryQty,
      unit,
      description,
      images,
      isAvailable,
    } = body;

    // Validate required fields
    if (!name || !price || !inventoryQty || !unit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update the product
    const updatedProduct = await db.product.update({
      where: { id: productId },
      data: {
        name,
        strain: strain || null,
        category: category || null,
        subcategory: subcategory || null,
        thc: thc !== undefined && thc !== null ? parseFloat(thc) : null,
        cbd: cbd !== undefined && cbd !== null ? parseFloat(cbd) : null,
        price: parseFloat(price),
        inventoryQty: parseInt(inventoryQty),
        unit,
        description: description || null,
        images: images !== undefined ? images : existingProduct.images,
        isAvailable: isAvailable !== undefined ? isAvailable : existingProduct.isAvailable,
      },
    });

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a product
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    
    if (user.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const productId = (await context.params).id;

    // Check if product exists and belongs to grower
    const existingProduct = await db.product.findFirst({
      where: {
        id: productId,
        growerId: user.growerId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete the product
    await db.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
