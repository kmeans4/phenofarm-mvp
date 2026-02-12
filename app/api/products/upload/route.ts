import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';

// Handles file uploads with base64 encoding
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
    const mimeType = file.type;
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    if (!validExtensions.includes(extension || '')) {
      return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.' }, { status: 400 });
    }

    // Store in database
    const updatedProduct = await db.product.update({
      where: { id: productId, growerId: user.growerId },
      data: {
        images: {
          push: base64,
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      imageBase64: base64,
      images: updatedProduct.images 
    }, { status: 200 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE endpoint for removing an image
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    
    if (user.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { productId, imageIndex } = await request.json();

    if (imageIndex === undefined) {
      return NextResponse.json({ error: 'Image index required' }, { status: 400 });
    }

    const product = await db.product.findFirst({
      where: { id: productId, growerId: user.growerId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const newImages = product.images.filter((_: any, i: number) => i !== imageIndex);

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
