import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Product } from '@prisma/client';

// Helper to serialize product from Prisma
function serializeProduct(product: Product | null) {
  if (!product) return product;
  return {
    ...product,
    price: product.price ? parseFloat(product.price.toString()) : 0,
    thc: product.thc ? parseFloat(product.thc.toString()) : null,
    cbd: product.cbd ? parseFloat(product.cbd.toString()) : null,
  };
}

interface SessionUser {
  role: string;
  growerId: string;
}

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

    const user = session.user as SessionUser;
    
    if (user.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const productId = (await context.params).id;

    const product = await db.product.findFirst({
      where: { id: productId, growerId: user.growerId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(serializeProduct(product), { status: 200 });
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

    const user = session.user as SessionUser;
    if (user.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const productId = (await context.params).id;

    const existingProduct = await db.product.findFirst({
      where: { id: productId, growerId: user.growerId },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const body = await request.json() as {
      name?: string;
      strain?: string | null;
      category?: string | null;
      subcategory?: string | null;
      thc?: string | null;
      cbd?: string | null;
      price?: string;
      inventoryQty?: string;
      unit?: string;
      description?: string | null;
      images?: string[];
      isAvailable?: boolean;
    };
    
    const updateData: Record<string, unknown> = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.strain !== undefined) updateData.strain = body.strain || null;
    if (body.category !== undefined) updateData.category = body.category || null;
    if (body.subcategory !== undefined) updateData.subcategory = body.subcategory || null;
    if (body.thc !== undefined) updateData.thc = body.thc !== null ? parseFloat(body.thc) : null;
    if (body.cbd !== undefined) updateData.cbd = body.cbd !== null ? parseFloat(body.cbd) : null;
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.inventoryQty !== undefined) updateData.inventoryQty = parseInt(body.inventoryQty);
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.isAvailable !== undefined) updateData.isAvailable = body.isAvailable;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updatedProduct = await db.product.update({
      where: { id: productId },
      data: updateData,
    });

    return NextResponse.json(serializeProduct(updatedProduct), { status: 200 });
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

    const user = session.user as SessionUser;
    if (user.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const productId = (await context.params).id;

    const existingProduct = await db.product.findFirst({
      where: { id: productId, growerId: user.growerId },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await db.product.delete({ where: { id: productId } });

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
