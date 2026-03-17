import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import { parseProductPayload } from '@/lib/product-payload';

function serializeProduct(product: any) {
  if (!product) return product;
  return {
    ...product,
    price: product.price ? parseFloat(product.price.toString()) : 0,
    thcLegacy: product.thcLegacy ? parseFloat(product.thcLegacy.toString()) : null,
    cbdLegacy: product.cbdLegacy ? parseFloat(product.cbdLegacy.toString()) : null,
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user;
    if (user.role !== 'GROWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const productId = (await context.params).id;
    const product = await db.product.findFirst({
      where: { id: productId, growerId: user.growerId },
      include: { strain: true, batch: true },
    });

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json(serializeProduct(product), { status: 200 });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user;
    if (user.role !== 'GROWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const productId = (await context.params).id;
    const existingProduct = await db.product.findFirst({ where: { id: productId, growerId: user.growerId } });
    if (!existingProduct) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const body = await request.json();
    const parsed = parseProductPayload(body, {
      partial: true,
      defaultStatus: existingProduct.status as any,
    });

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.errors.join(', ') }, { status: 400 });
    }

    const data = parsed.data;

    if (data.strainId) {
      const strain = await db.strain.findFirst({ where: { id: data.strainId, growerId: user.growerId } });
      if (!strain) return NextResponse.json({ error: 'Strain not found' }, { status: 404 });
    }

    if (data.batchId) {
      const batch = await db.batch.findFirst({ where: { id: data.batchId, growerId: user.growerId } });
      if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    const updateData: any = {};

    if (body.name !== undefined) updateData.name = data.name || 'Untitled Draft Product';
    if (body.productType !== undefined) updateData.productType = data.productType;
    if (body.subType !== undefined) updateData.subType = data.subType;
    if (body.strainId !== undefined) updateData.strainId = data.strainId;
    if (body.batchId !== undefined) updateData.batchId = data.batchId;
    if (body.price !== undefined && data.price !== null) updateData.price = data.price;
    if (body.inventoryQty !== undefined && data.inventoryQty !== null) updateData.inventoryQty = data.inventoryQty;
    if (body.unit !== undefined && data.unit) updateData.unit = data.unit;
    if (body.description !== undefined) updateData.description = data.description;
    if (body.images !== undefined) updateData.images = data.images || [];
    if (body.sku !== undefined) updateData.sku = data.sku;
    if (body.brand !== undefined) updateData.brand = data.brand;
    if (body.ingredients !== undefined) updateData.ingredients = data.ingredients;
    if (body.ingredientsDocumentUrl !== undefined) updateData.ingredientsDocumentUrl = data.ingredientsDocumentUrl;
    if (body.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;

    if (body.strainLegacy !== undefined) updateData.strainLegacy = data.strainLegacy;
    if (body.categoryLegacy !== undefined) updateData.categoryLegacy = data.categoryLegacy;
    if (body.subcategoryLegacy !== undefined) updateData.subcategoryLegacy = data.subcategoryLegacy;
    if (body.thcLegacy !== undefined) updateData.thcLegacy = data.thcLegacy;
    if (body.cbdLegacy !== undefined) updateData.cbdLegacy = data.cbdLegacy;

    const effectiveInventory = updateData.inventoryQty ?? existingProduct.inventoryQty;

    if (body.isAvailable !== undefined) {
      updateData.isAvailable = effectiveInventory > 0 ? Boolean(body.isAvailable) : false;
    } else if (updateData.inventoryQty !== undefined) {
      updateData.isAvailable = effectiveInventory > 0 ? existingProduct.isAvailable : false;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updatedProduct = await db.product.update({
      where: { id: productId },
      data: updateData,
      include: { strain: true, batch: true },
    });

    return NextResponse.json(serializeProduct(updatedProduct), { status: 200 });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user;
    if (user.role !== 'GROWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const productId = (await context.params).id;
    const existingProduct = await db.product.findFirst({ where: { id: productId, growerId: user.growerId } });
    if (!existingProduct) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    await db.product.update({
      where: { id: productId },
      data: { isDeleted: true, deletedAt: new Date(), isAvailable: false },
    });

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
