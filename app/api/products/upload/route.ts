import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import {
  FILE_UPLOAD_LIMITS,
  sanitizeFileName,
  validatePdfBytes,
  validateProductDocumentFile,
  validateProductImageBytes,
  validateProductImageFile,
  validateLogoFile,
} from '@/lib/upload-validation';
import { storeUpload } from '@/lib/blob-storage';

// Store URLs in records; local development uses files under public/uploads.
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    
    if (!['GROWER', 'DISPENSARY'].includes(user.role) || (user.role === 'GROWER' ? !user.growerId : !user.dispensaryId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const kind = formData.get('kind');
    if (user.role !== 'GROWER' && kind !== 'logo') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const singleFile = formData.get('file');
    const files = formData.getAll('files').filter((value): value is File => value instanceof File);
    if (singleFile instanceof File) files.push(singleFile);
    if (kind === 'logo' && (files.length !== 1 || formData.get('productId'))) return NextResponse.json({ error: 'Upload one logo' }, { status: 400 });
    const productId = formData.get('productId') as string;
    const fileType = formData.get('fileType') as string || 'image'; // 'image' or 'document'

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (!['image', 'document'].includes(fileType) || (kind === 'logo' && fileType !== 'image')) {
      return NextResponse.json({ error: 'fileType must be image or document' }, { status: 400 });
    }

    if (fileType === 'image' && files.length > FILE_UPLOAD_LIMITS.productImagesMaxCount) {
      return NextResponse.json(
        { error: `Upload at most ${FILE_UPLOAD_LIMITS.productImagesMaxCount} product images at a time.` },
        { status: 400 }
      );
    }

    if (fileType === 'document' && files.length > 1) {
      return NextResponse.json({ error: 'Upload one product document at a time.' }, { status: 400 });
    }

    const existingProduct = productId
      ? await db.product.findFirst({
          where: { id: productId, growerId: user.growerId },
          select: { id: true, images: true },
        })
      : null;

    if (productId && !existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (
      fileType === 'image' &&
      existingProduct &&
      existingProduct.images.length + files.length > FILE_UPLOAD_LIMITS.productImagesMaxCount
    ) {
      return NextResponse.json(
        { error: `Products can have at most ${FILE_UPLOAD_LIMITS.productImagesMaxCount} images. Remove an existing image before uploading more.` },
        { status: 400 }
      );
    }

    const uploadedFiles: { fileName: string; dataUrl: string; extension: string; size: number; mimeType: string; storage: 'blob' | 'local' }[] = [];

    for (const file of files) {
      const validation = fileType === 'image'
        ? (kind === 'logo' ? validateLogoFile(file) : validateProductImageFile(file))
        : validateProductDocumentFile(file);

      if (!validation.ok) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const bytes = Buffer.from(await file.arrayBuffer());
      const byteValidation = fileType === 'image'
        ? validateProductImageBytes(bytes, file.name)
        : validatePdfBytes(bytes, file.name);

      if (!byteValidation.ok) {
        return NextResponse.json({ error: byteValidation.error }, { status: 400 });
      }

      const extension = file.name.split('.').pop()?.toLowerCase();
      const stored = await storeUpload({
        bytes,
        mimeType: file.type,
        fileName: file.name,
        pathPrefix: `products/${user.growerId || user.dispensaryId}/${fileType === 'image' ? 'images' : 'documents'}`,
      });

      uploadedFiles.push({
        fileName: sanitizeFileName(file.name),
        dataUrl: stored.url,
        extension: extension || '',
        size: file.size,
        mimeType: file.type,
        storage: stored.storage,
      });
    }

    // If productId is provided, update the product
    if (existingProduct) {
      if (fileType === 'image') {
        const existingImages = existingProduct?.images || [];
        const newImages = [...existingImages, ...uploadedFiles.map(f => f.dataUrl)];
        
        const updatedProduct = await db.product.update({
          where: { id: existingProduct.id },
          data: {
            images: newImages,
          },
        });

        return NextResponse.json({ 
          success: true, 
          images: updatedProduct.images,
          uploadedFiles,
        }, { status: 200 });
      } else if (fileType === 'document') {
        const updatedProduct = await db.product.update({
          where: { id: existingProduct.id },
          data: {
            ingredientsDocumentUrl: uploadedFiles[0].dataUrl,
          },
        });

        return NextResponse.json({ 
          success: true, 
          documentUrl: updatedProduct.ingredientsDocumentUrl,
          fileName: uploadedFiles[0].fileName,
        }, { status: 200 });
      }
    }

    // Return the uploaded files for client to use
    return NextResponse.json({ 
      success: true,
      url: uploadedFiles[0]?.dataUrl,
      uploadedFiles,
    }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('storage is not configured')) return NextResponse.json({ error: error.message }, { status: 503 });
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

    const user = session.user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
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
