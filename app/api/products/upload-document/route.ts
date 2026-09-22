import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { sanitizeFileName, validatePdfBytes, validateProductDocumentFile } from '@/lib/upload-validation';
import { storeUpload } from '@/lib/blob-storage';

// Store URLs in records; local development uses files under public/uploads.
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const productId = formData.get('productId') as string;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validation = validateProductDocumentFile(file);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const byteValidation = validatePdfBytes(bytes, file.name);
    if (!byteValidation.ok) {
      return NextResponse.json({ error: byteValidation.error }, { status: 400 });
    }

    const product = productId ? await db.product.findFirst({ where: { id: productId, growerId: user.growerId, isDeleted: false }, select: { id: true } }) : null;
    if (productId && !product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const safeFileName = sanitizeFileName(file.name);
    const stored = await storeUpload({
      bytes,
      mimeType: file.type,
      fileName: file.name,
      pathPrefix: `products/${user.growerId}/documents`,
    });

    // If productId is provided, update the product directly
    if (productId) {
      const updatedProduct = await db.product.update({
        where: { id: product!.id },
        data: {
          ingredientsDocumentUrl: stored.url,
        },
      });

      return NextResponse.json({ 
        success: true, 
        documentUrl: updatedProduct.ingredientsDocumentUrl,
        fileName: safeFileName,
      }, { status: 200 });
    }

    return NextResponse.json({ 
      success: true, 
      url: stored.url,
      documentUrl: stored.url,
      fileName: safeFileName,
      storage: stored.storage,
    }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('storage is not configured')) return NextResponse.json({ error: error.message }, { status: 503 });
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
