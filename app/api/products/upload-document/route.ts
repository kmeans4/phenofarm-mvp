import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

// Handles document uploads (PDF, Word) with base64 encoding
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    
    if (user.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    
    // Determine file type
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['pdf', 'doc', 'docx'];
    
    if (!validExtensions.includes(extension || '')) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF, DOC, and DOCX are allowed.' }, { status: 400 });
    }

    // If productId is provided, update the product directly
    if (productId) {
      const updatedProduct = await db.product.update({
        where: { id: productId, growerId: user.growerId },
        data: {
          ingredientsDocumentUrl: base64,
        },
      });

      return NextResponse.json({ 
        success: true, 
        documentBase64: base64,
        fileName: file.name,
      }, { status: 200 });
    }

    // Return the base64 for client to use
    return NextResponse.json({ 
      success: true, 
      documentBase64: base64,
      fileName: file.name,
    }, { status: 200 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
