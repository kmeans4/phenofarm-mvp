import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Bulk upload products endpoint
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
    const { products } = body;

    if (!products || !Array.isArray(products)) {
      return NextResponse.json({ error: 'No products data provided' }, { status: 400 });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const createdProducts: any[] = [];

    for (const productData of products) {
      try {
        const product = await db.product.create({
          data: {
            growerId: user.growerId,
            name: productData.name,
            strain: productData.strain || null,
            category: productData.category || null,
            subcategory: productData.subcategory || null,
            thc: productData.thc !== undefined && productData.thc !== null ? parseFloat(productData.thc) : null,
            cbd: productData.cbd !== undefined && productData.cbd !== null ? parseFloat(productData.cbd) : null,
            price: parseFloat(productData.price),
            inventoryQty: parseInt(productData.inventoryQty),
            unit: productData.unit,
            description: productData.description || null,
            images: productData.images || [],
            isAvailable: productData.isAvailable !== undefined ? productData.isAvailable : true,
          },
        });
        
        successCount++;
        createdProducts.push(product);
      } catch (err: any) {
        errors.push(`Product "${productData.name}": ${err.message}`);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      totalRows: products.length,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined,
      createdProducts,
    }, { status: 200 });
  } catch (error) {
    console.error('Error in bulk upload:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Export products for download
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

    // Convert to CSV format
    const headers = ['name', 'strain', 'category', 'subcategory', 'thc', 'cbd', 'price', 'inventoryQty', 'unit', 'description', 'isAvailable', 'images'];
    
    const csvContent = [
      headers.join(','),
      ...products.map((p: any) => [
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

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    return NextResponse.json({
      downloadUrl: url,
      rowCount: products.length,
    }, { status: 200 });
  } catch (error) {
    console.error('Error exporting products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
