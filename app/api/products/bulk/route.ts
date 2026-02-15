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

        // Map legacy column names to new schema fields
        await db.product.create({
          data: {
            growerId,
            name: productData.name || '',
            // New flexible type/subtype system
            productType: productData.producttype || productData.category || null,
            subType: productData.subtype || productData.subcategory || null,
            // Legacy fields for backwards compatibility
            strainLegacy: productData.strain || null,
            categoryLegacy: productData.category || null,
            subcategoryLegacy: productData.subcategory || null,
            thcLegacy: productData.thc ? parseFloat(productData.thc) : null,
            cbdLegacy: productData.cbd ? parseFloat(productData.cbd) : null,
            price: parseFloat(productData.price || '0'),
            inventoryQty: parseInt(productData.inventoryqty || '0'),
            unit: productData.unit || 'Gram',
            description: productData.description || null,
            images: productData.images ? productData.images.split(';') : [],
            isAvailable: productData.isavailable !== 'false',
            sku: productData.sku || null,
            brand: productData.brand || null,
            isFeatured: productData.isfeatured === 'true',
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
      // Updated template with new field names
      const templateHeaders = ['name', 'productType', 'subType', 'strain', 'price', 'inventoryQty', 'unit', 'description', 'isAvailable', 'images', 'sku', 'brand'];
      const sampleRow = [
        'Blue Dream - 3.5g Jar', 'Flower', '3.5g Jar', 'Blue Dream',
        '45.00', '100', 'Gram',
        'Premium sativa flower with berry aroma', 'true',
        'https://example.com/image1.jpg', 'BD-001', 'PhenoFarm'
      ];
      
      const csvContent = [
        templateHeaders.join(','),
        sampleRow.join(',')
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=product-template.csv',
        },
      });
    }

    return NextResponse.json({ error: 'Template not specified' }, { status: 400 });
  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
