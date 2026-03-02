import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

// Handles file uploads (images and documents) with base64 encoding
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;
    
    if (user.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const productId = formData.get('productId') as string;
    const fileType = formData.get('fileType') as string || 'image'; // 'image' or 'document'

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedFiles: { fileName: string; base64: string; extension: string }[] = [];

    for (const file of files) {
      // Convert file to base64
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');
      
      // Determine file type
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileType === 'image') {
        const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (!validExtensions.includes(extension || '')) {
          return NextResponse.json({ error: `Invalid file type for ${file.name}. Only JPG, PNG, GIF, and WebP are allowed.` }, { status: 400 });
        }
      } else if (fileType === 'document') {
        const validExtensions = ['pdf', 'doc', 'docx'];
        if (!validExtensions.includes(extension || '')) {
          return NextResponse.json({ error: `Invalid file type for ${file.name}. Only PDF, DOC, and DOCX are allowed.` }, { status: 400 });
        }
      }

      uploadedFiles.push({
        fileName: file.name,
        base64,
        extension: extension || '',
      });
    }

    // If productId is provided, update the product
    if (productId) {
      if (fileType === 'image') {
        const existingProduct = await db.product.findFirst({
          where: { id: productId, growerId: user.growerId },
        });
        
        const existingImages = existingProduct?.images || [];
        const newImages = [...existingImages, ...uploadedFiles.map(f => f.base64)];
        
        // Limit to 5 images
        const limitedImages = newImages.slice(0, 5);
        
        const updatedProduct = await db.product.update({
          where: { id: productId, growerId: user.growerId },
          data: {
            images: limitedImages,
          },
        });

        return NextResponse.json({ 
          success: true, 
          images: updatedProduct.images,
          uploadedFiles,
        }, { status: 200 });
      } else if (fileType === 'document') {
        // For documents, store the first one (ingredients document)
        const updatedProduct = await db.product.update({
          where: { id: productId, growerId: user.growerId },
          data: {
            ingredientsDocumentUrl: uploadedFiles[0].base64,
          },
        });

        return NextResponse.json({ 
          success: true, 
          documentBase64: uploadedFiles[0].base64,
          fileName: uploadedFiles[0].fileName,
        }, { status: 200 });
      }
    }

    // Return the uploaded files for client to use
    return NextResponse.json({ 
      success: true, 
      uploadedFiles,
    }, { status: 200 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE endpoint for removing an image
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;
    
    if (user.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { productId, imageIndex } = await request.json() as { productId: string; imageIndex: number };

    if (imageIndex === undefined) {
      return NextResponse.json({ error: 'Image index required' }, { status: 400 });
    }

    const product = await db.product.findFirst({
      where: { id: productId, growerId: user.growerId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const newImages = product.images.filter((_: string, i: number) => i !== imageIndex);

    await db.product.update({
      where: { id: productId },
      data: { images: newImages },
    });

    return NextResponse.json({ 
      success: true, 
      images: newImages 
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
