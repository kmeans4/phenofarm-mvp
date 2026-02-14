import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { ExtendedUser } from '@/types';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = (session as any).user as ExtendedUser;

  if (user.role !== 'GROWER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _request = request;
    const template = `name,strain,category,subcategory,thc,cbd,price,inventoryQty,unit,isAvailable,description,images
Sample Product,Indica dominant,Flower,,25,1,50.00,100,gram,true,High quality flower,
Sample Product 2,Sativa dominant,Flower,,18,0.5,45.00,50,gram,true,Lighter effects,
Sample Product 3,Hybrid,Concentrate,,30,2,75.00,25,gram,true,Pure extract,
`;

    return new Response(template, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="products-template.csv"',
      },
    });
  } catch (error) {
    console.error('Template Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = (session as any).user as ExtendedUser;

  if (user.role !== 'GROWER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(fileBuffer).toString('utf-8');

    // Parse CSV
    const records = parseCSV(fileContent);

    // Validate CSV structure
    const requiredColumns = ['name', 'strain', 'category', 'price', 'inventoryQty'];
    const missingColumns = requiredColumns.filter(
      (col) => !records[0]?.hasOwnProperty(col)
    );

    if (missingColumns.length > 0) {
      return NextResponse.json(
        { error: 'Missing required columns', columns: missingColumns },
        { status: 400 }
      );
    }

    // Process records
    const products = records.map((record: Record<string, string>) => ({
      growerId: user.growerId!,
      name: record.name,
      strain: record.strain || null,
      category: record.category || null,
      subcategory: record.subcategory || null,
      thc: record.thc ? parseFloat(record.thc) : null,
      cbd: record.cbd ? parseFloat(record.cbd) : null,
      price: record.price,
      inventoryQty: parseInt(record.inventoryQty) || 0,
      unit: record.unit || 'gram',
      isAvailable: record.isAvailable !== 'false',
      description: record.description || null,
      images: record.images ? record.images.split(',') : [],
    }));

    const createdProducts = await db.product.createMany({
      data: products,
    });

    return NextResponse.json({
      success: true,
      count: createdProducts.count,
    });
  } catch (error: unknown) {
    console.error('CSV Upload Error:', error);
    return NextResponse.json(
      { error: 'Failed to process CSV file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Simple CSV parser (handles basic cases)
function parseCSV(csv: string) {
  const lines = csv.split('\n').filter((line) => line.trim());
  const headers = lines[0].split(',').map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  });
}
