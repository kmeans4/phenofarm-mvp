import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface SessionUser {
  role: string;
  growerId: string;
}

// Bulk upload products endpoint
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as SessionUser;
    
    if (user.role !== 'GROWER') {
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
    
    // Expected columns
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
        const productData: Record<string, string | null> = {};
        headers.forEach((header, index) => {
          productData[header] = values[index] || null;
        });

        await db.product.create({
          data: {
            growerId: user.growerId,
            name: productData.name,
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

// Export products for download (CSV) or template
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const template = searchParams.get('template');

    // Allow template download without auth for convenience
    if (!session && !template) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return template if requested
    if (template === 'true') {
      const templateHeaders = ['name', 'strain', 'category', 'subcategory', 'thc', 'cbd', 'price', 'inventoryQty', 'unit', 'description', 'isAvailable', 'images'];
      const sampleRow = [
        'Blue Dream',
        'Blue Dream x Haze',
        'Flower',
        'Sativa',
        '18.5',
        '0.2',
        '45.00',
        '100',
        'Ounce',
        'Premium sativa flower with berry aroma',
        'true',
        'https://example.com/image1.jpg;https://example.com/image2.jpg'
      ];
      
      const csvContent = [
        templateHeaders.join(','),
        sampleRow.join(','),
        '"Northern Lights","Northern Lights x Afghan","Flower","Indica","22.0","0.1","50.00","75","Ounce","Potent indica for relaxation","true",""'
      ].join('\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="products-template.csv"',
        },
      });
    }

    const user = session?.user as SessionUser | undefined;
    
    if (user?.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const products = await db.product.findMany({
      where: { growerId: user.growerId },
      orderBy: { createdAt: 'desc' },
    });

    // Convert to CSV format
    const csvHeaders = ['name', 'strain', 'category', 'subcategory', 'thc', 'cbd', 'price', 'inventoryQty', 'unit', 'description', 'isAvailable', 'images'];
    
    const csvContent = [
      csvHeaders.join(','),
      ...products.map((p) => [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${(p.strain || '').replace(/"/g, '""')}"`,
        `"${(p.category || '').replace(/"/g, '""')}"`,
        `"${(p.subcategory || '').replace(/"/g, '""')}"`,
        p.thc ?? '',
        p.cbd ?? '',
        p.price.toString(),
        p.inventoryQty.toString(),
        p.unit,
        `"${(p.description || '').replace(/"/g, '""')}"`,
        p.isAvailable.toString(),
        `"${(p.images || []).join(';').replace(/"/g, '""')}"`,
      ].join(','))
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
