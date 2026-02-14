import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';

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

    const formData = await request.formData();
    const csvFile = formData.get('file') as File;

    if (!csvFile) {
      return NextResponse.json({ error: 'No CSV file provided' }, { status: 400 });
    }

    const csvContent = await csvFile.text();
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length <= 1) {
      return NextResponse.json({ error: 'CSV file is empty or has no data rows' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const requiredHeaders = ['name', 'price', 'inventoryqty', 'unit'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return NextResponse.json({ 
        error: `Missing required columns: ${missingHeaders.join(', ')}` 
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
        const productData: Record<string, string | null> = {};
        headers.forEach((header, index) => {
          productData[header] = values[index] || null;
        });

        const growerId = user.growerId!;

        await db.product.create({
          data: {
            growerId,
            name: productData.name || '',
            strain: productData.strain || null,
            category: productData.category || null,
            subcategory: productData.subcategory || null,
            thc: productData.thc ? parseFloat(productData.thc) : null,
            cbd: productData.cbd ? parseFloat(productData.cbd) : null,
            price: parseFloat(productData.price || '0'),
            inventoryQty: parseInt(productData.inventoryQty || '0'),
            unit: productData.unit || 'Unit',
            description: productData.description || null,
            images: productData.images ? productData.images.split(';') : [],
            isAvailable: productData.isavailable !== 'false',
          },
        });
        
        successCount++;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Row ${i + 1}: ${errorMessage}`);
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

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const { searchParams } = new URL(request.url);
    const template = searchParams.get('template');

    if (!session && !template) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (template === 'true') {
      const templateHeaders = ['name', 'strain', 'category', 'subcategory', 'thc', 'cbd', 'price', 'inventoryQty', 'unit', 'description', 'isAvailable', 'images'];
      const sampleRow = [
        'Blue Dream', 'Blue Dream x Haze', 'Flower', 'Sativa',
        '18.5', '0.2', '45.00', '100', 'Ounce',
        'Premium sativa flower with berry aroma', 'true',
        'https://example.com/image1.jpg;https://example.com/image2.jpg'
      ];
      
      const csvContent = [
        templateHeaders.join(','),
        sampleRow.join(','),
      ].join('\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="products-template.csv"',
        },
      });
    }

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const products = await db.product.findMany({
      where: { growerId: user.growerId },
      orderBy: { name: 'asc' },
    });

    const headers = ['name', 'strain', 'category', 'subcategory', 'thc', 'cbd', 'price', 'inventoryQty', 'unit', 'description', 'isAvailable', 'images'];
    
    const rows = products.map(p => [
      p.name,
      p.strain || '',
      p.category || '',
      p.subcategory || '',
      p.thc?.toString() || '',
      p.cbd?.toString() || '',
      p.price.toString(),
      p.inventoryQty.toString(),
      p.unit,
      p.description || '',
      p.isAvailable.toString(),
      p.images.join(';'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${v.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="products-export.csv"',
      },
    });
  } catch (error) {
    console.error('Error exporting products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
