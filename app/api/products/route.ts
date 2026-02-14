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
    const category = searchParams.get('category');
    const isAvailable = searchParams.get('isAvailable');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Prisma.ProductWhereInput = {
      growerId,
      ...(category && { category }),
      ...(isAvailable !== null && { isAvailable: isAvailable === 'true' }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { strain: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const products = await db.product.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const serializedProducts = products.map((p) => ({
      ...p,
      price: p.price ? parseFloat(String(p.price)) : 0,
      thc: p.thc ? parseFloat(String(p.thc)) : null,
      cbd: p.cbd ? parseFloat(String(p.cbd)) : null,
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
      isAvailable = true,
    } = body;

    if (!name || price === undefined || inventoryQty === undefined || !unit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const product = await db.product.create({
      data: {
        growerId,
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
        images: images || [],
        isAvailable,
      },
    });

    const serializedProduct = {
      ...product,
      price: product.price ? parseFloat(String(product.price)) : 0,
      thc: product.thc ? parseFloat(String(product.thc)) : null,
      cbd: product.cbd ? parseFloat(String(product.cbd)) : null,
    };

    return NextResponse.json(serializedProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
