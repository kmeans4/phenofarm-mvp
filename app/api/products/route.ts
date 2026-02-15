import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import { Prisma } from '@prisma/client';

// GET all products for the authenticated grower with filtering and sorting
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const growerId = user.growerId;

    const { searchParams } = new URL(request.url);
    const productType = searchParams.get('productType');
    const strainId = searchParams.get('strainId');
    const batchId = searchParams.get('batchId');
    const isAvailable = searchParams.get('isAvailable');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Prisma.ProductWhereInput = {
      growerId,
      isDeleted: false,
      ...(productType && { productType }),
      ...(strainId && { strainId }),
      ...(batchId && { batchId }),
      ...(isAvailable !== null && { isAvailable: isAvailable === 'true' }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { strainLegacy: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const products = await db.product.findMany({
      where,
      include: {
        strain: {
          select: { id: true, name: true, genetics: true }
        },
        batch: {
          select: { 
            id: true, 
            batchNumber: true, 
            harvestDate: true,
            thc: true,
            cbd: true,
            totalCannabinoids: true,
            terpenes: true
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
    });

    const serializedProducts = products.map((p) => ({
      ...p,
      price: p.price ? parseFloat(String(p.price)) : 0,
      thcLegacy: p.thcLegacy ? parseFloat(String(p.thcLegacy)) : null,
      cbdLegacy: p.cbdLegacy ? parseFloat(String(p.cbdLegacy)) : null,
    }));

    return NextResponse.json(serializedProducts, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create a new product
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const growerId = user.growerId;

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
      isAvailable = true,
      sku,
      brand,
      ingredients,
      ingredientsDocumentUrl,
      isFeatured = false,
      // Legacy fields for backwards compatibility
      strainLegacy,
      categoryLegacy,
      subcategoryLegacy,
      thcLegacy,
      cbdLegacy,
    } = body;

    if (!name || price === undefined || inventoryQty === undefined || !unit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify strain belongs to grower if provided
    if (strainId) {
      const strain = await db.strain.findFirst({
        where: { id: strainId, growerId }
      });
      if (!strain) {
        return NextResponse.json({ error: 'Strain not found' }, { status: 404 });
      }
    }

    // Verify batch belongs to grower if provided
    if (batchId) {
      const batch = await db.batch.findFirst({
        where: { id: batchId, growerId }
      });
      if (!batch) {
        return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
      }
    }

    const product = await db.product.create({
      data: {
        growerId,
      isDeleted: false,
        name,
        productType: productType || null,
        subType: subType || null,
        strainId: strainId || null,
        batchId: batchId || null,
        strainLegacy: strainLegacy || null,
        categoryLegacy: categoryLegacy || null,
        subcategoryLegacy: subcategoryLegacy || null,
        thcLegacy: thcLegacy !== undefined ? parseFloat(thcLegacy) : null,
        cbdLegacy: cbdLegacy !== undefined ? parseFloat(cbdLegacy) : null,
        price: parseFloat(price),
        inventoryQty: parseInt(inventoryQty),
        unit,
        description: description || null,
        images: images || [],
        isAvailable,
        sku: sku || null,
        brand: brand || null,
        ingredients: ingredients || null,
        ingredientsDocumentUrl: ingredientsDocumentUrl || null,
        isFeatured,
      },
      include: {
        strain: {
          select: { id: true, name: true, genetics: true }
        },
        batch: {
          select: { 
            id: true, 
            batchNumber: true, 
            harvestDate: true,
            thc: true,
            cbd: true,
            totalCannabinoids: true
          }
        }
      }
    });

    const serializedProduct = {
      ...product,
      price: product.price ? parseFloat(String(product.price)) : 0,
      thcLegacy: product.thcLegacy ? parseFloat(String(product.thcLegacy)) : null,
      cbdLegacy: product.cbdLegacy ? parseFloat(String(product.cbdLegacy)) : null,
    };

    return NextResponse.json(serializedProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
