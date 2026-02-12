import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET all products for the authenticated grower with filtering and sorting
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
    const category = searchParams.get('category');
    const isAvailable = searchParams.get('isAvailable');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: any = {
      growerId: user.growerId,
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
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create a new product
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

    // Validate required fields
    if (!name || !price || !inventoryQty || !unit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create the product
    const product = await db.product.create({
      data: {
        growerId: user.growerId,
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

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
