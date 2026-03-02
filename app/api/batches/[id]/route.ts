import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';

// GET single batch by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const growerId = user.growerId;

    const batch = await db.batch.findFirst({
      where: { id, growerId },
      include: {
        strain: true,
        products: {
          select: { id: true, name: true, inventoryQty: true, price: true }
        },
        _count: {
          select: { products: true }
        }
      }
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json(batch, { status: 200 });
  } catch (error) {
    console.error('Error fetching batch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update a batch
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const growerId = user.growerId;
    const body = await request.json();

    // Verify ownership
    const existing = await db.batch.findFirst({
      where: { id, growerId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    const { 
      batchNumber, 
      lotNumber, 
      harvestDate, 
      strainId,
      thc, 
      cbd, 
      totalCannabinoids,
      terpenes,
      coaDocumentUrl,
      testResults,
      notes 
    } = body;

    // Check for duplicate batch number if changing
    if (batchNumber && batchNumber !== existing.batchNumber) {
      const duplicate = await db.batch.findFirst({
        where: { growerId, batchNumber }
      });
      if (duplicate) {
        return NextResponse.json({ error: 'A batch with this number already exists' }, { status: 409 });
      }
    }

    // Verify strain if being changed
    if (strainId && strainId !== existing.strainId) {
      const strain = await db.strain.findFirst({
        where: { id: strainId, growerId }
      });
      if (!strain) {
        return NextResponse.json({ error: 'Strain not found' }, { status: 404 });
      }
    }

    const batch = await db.batch.update({
      where: { id },
      data: {
        ...(batchNumber && { batchNumber }),
        ...(lotNumber !== undefined && { lotNumber }),
        ...(harvestDate && { harvestDate: new Date(harvestDate) }),
        ...(strainId && { strainId }),
        ...(thc !== undefined && { thc: thc !== null ? parseFloat(thc) : null }),
        ...(cbd !== undefined && { cbd: cbd !== null ? parseFloat(cbd) : null }),
        ...(totalCannabinoids !== undefined && { totalCannabinoids: totalCannabinoids !== null ? parseFloat(totalCannabinoids) : null }),
        ...(terpenes !== undefined && { terpenes }),
        ...(coaDocumentUrl !== undefined && { coaDocumentUrl }),
        ...(testResults !== undefined && { testResults }),
        ...(notes !== undefined && { notes })
      }
    });

    return NextResponse.json(batch, { status: 200 });
  } catch (error) {
    console.error('Error updating batch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a batch
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const growerId = user.growerId;

    // Verify ownership and check for related data
    const existing = await db.batch.findFirst({
      where: { id, growerId },
      include: {
        _count: { select: { products: true } }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Check if batch has products
    if (existing._count.products > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete batch with associated products' 
      }, { status: 409 });
    }

    await db.batch.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Batch deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting batch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
