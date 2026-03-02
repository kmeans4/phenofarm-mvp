import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';

// Helper to serialize product from Prisma
function serializeProduct(product: any) {
  if (!product) return product;
  return {
    ...product,
    price: product.price ? parseFloat(product.price.toString()) : 0,
    thcLegacy: product.thcLegacy ? parseFloat(product.thcLegacy.toString()) : null,
    cbdLegacy: product.cbdLegacy ? parseFloat(product.cbdLegacy.toString()) : null,
  };
}

// GET a single product by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    
    if (user.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const productId = (await context.params).id;

    const product = await db.product.findFirst({
      where: { id: productId, growerId: user.growerId },
      include: {
        strain: true,
        batch: true
      }
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
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
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

    const body = await request.json();
    
    const {
      name,
      productType,
      subType,
      strainId,
      batchId,
      price,
      inventoryQty,
      unit,
      description,
      images,
      isAvailable,
      sku,
      brand,
      ingredients,
      ingredientsDocumentUrl,
      isFeatured,
      // Legacy fields
      strainLegacy,
      categoryLegacy,
      subcategoryLegacy,
      thcLegacy,
      cbdLegacy,
    } = body;

    // Verify strain belongs to grower if provided
    if (strainId) {
      const strain = await db.strain.findFirst({
        where: { id: strainId, growerId: user.growerId }
      });
      if (!strain) {
        return NextResponse.json({ error: 'Strain not found' }, { status: 404 });
      }
    }

    // Verify batch belongs to grower if provided
    if (batchId) {
      const batch = await db.batch.findFirst({
        where: { id: batchId, growerId: user.growerId }
      });
      if (!batch) {
        return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
      }
    }

    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (productType !== undefined) updateData.productType = productType || null;
    if (subType !== undefined) updateData.subType = subType || null;
    if (strainId !== undefined) updateData.strainId = strainId || null;
    if (batchId !== undefined) updateData.batchId = batchId || null;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (inventoryQty !== undefined) updateData.inventoryQty = parseInt(inventoryQty);
    if (unit !== undefined) updateData.unit = unit;
    if (description !== undefined) updateData.description = description || null;
    if (images !== undefined) updateData.images = images;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (sku !== undefined) updateData.sku = sku || null;
    if (brand !== undefined) updateData.brand = brand || null;
    if (ingredients !== undefined) updateData.ingredients = ingredients || null;
    if (ingredientsDocumentUrl !== undefined) updateData.ingredientsDocumentUrl = ingredientsDocumentUrl || null;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    // Legacy fields
    if (strainLegacy !== undefined) updateData.strainLegacy = strainLegacy || null;
    if (categoryLegacy !== undefined) updateData.categoryLegacy = categoryLegacy || null;
    if (subcategoryLegacy !== undefined) updateData.subcategoryLegacy = subcategoryLegacy || null;
    if (thcLegacy !== undefined) updateData.thcLegacy = thcLegacy !== null ? parseFloat(thcLegacy) : null;
    if (cbdLegacy !== undefined) updateData.cbdLegacy = cbdLegacy !== null ? parseFloat(cbdLegacy) : null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updatedProduct = await db.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        strain: true,
        batch: true
      }
    });

    return NextResponse.json(serializeProduct(updatedProduct), { status: 200 });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a product (soft delete)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
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

    // Soft delete instead of hard delete to handle FK constraints
    await db.product.update({
      where: { id: productId },
      data: { 
        isDeleted: true,
        deletedAt: new Date(),
        isAvailable: false // Also make unavailable when deleted
      },
    });

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
