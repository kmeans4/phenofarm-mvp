import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Product } from '@prisma/client';

// GET all products for the authenticated grower
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

    const products = await db.product.findMany({
      where: { growerId: user.growerId },
      orderBy: { createdAt: 'desc' },
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
        isAvailable: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT bulk upload CSV
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    
    if (user.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const csvFile = formData.get('csv') as File;

    if (!csvFile) {
      return NextResponse.json({ error: 'No CSV file provided' }, { status: 400 });
    }

    const csvContent = await csvFile.text();
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length <= 1) {
      return NextResponse.json({ error: 'CSV file is empty or has no data rows' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Expected columns: name, strain, category, subcategory, thc, cbd, price, inventoryQty, unit, description, images
    const requiredHeaders = ['name', 'price', 'inventoryqty', 'unit'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return NextResponse.json({ 
        error: `Missing required headers: ${missingHeaders.join(', ')}` 
      }, { status: 400 });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length < headers.length) {
        errors.push(`Row ${i + 1}: Missing values`);
        errorCount++;
        continue;
      }

      try {
        const productData: Record<string, any> = {};
        headers.forEach((header, index) => {
          productData[header] = values[index] || null;
        });

        const product = await db.product.create({
          data: {
            growerId: user.growerId,
            name: productData.name,
            strain: productData.strain || null,
            category: productData.category || null,
            subcategory: productData.subcategory || null,
            thc: productData.thc ? parseFloat(productData.thc) : null,
            cbd: productData.cbd ? parseFloat(productData.cbd) : null,
            price: parseFloat(productData.price),
            inventoryQty: parseInt(productData.inventoryQty),
            unit: productData.unit,
            description: productData.description || null,
            images: productData.images ? productData.images.split(';') : [], // Support multiple images separated by semicolon
            isAvailable: true,
          },
        });
        
        successCount++;
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message}`);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      totalRows: lines.length - 1,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined,
    }, { status: 200 });
  } catch (error) {
    console.error('Error uploading CSV:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
