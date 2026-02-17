import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';

// GET single strain by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const growerId = user.growerId;

    const strain = await db.strain.findFirst({
      where: { id, growerId },
      include: {
        batches: {
          orderBy: { harvestDate: 'desc' }
        },
        _count: {
          select: { products: true, batches: true }
        }
      }
    });

    if (!strain) {
      return NextResponse.json({ error: 'Strain not found' }, { status: 404 });
    }

    return NextResponse.json(strain, { status: 200 });
  } catch (error) {
    console.error('Error fetching strain:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update a strain
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const growerId = user.growerId;
    const body = await request.json();
    const { name, genetics, description, growerNotes } = body;

    // Verify ownership
    const existing = await db.strain.findFirst({
      where: { id, growerId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Strain not found' }, { status: 404 });
    }

    // Check for duplicate name if changing
    if (name && name !== existing.name) {
      const duplicate = await db.strain.findFirst({
        where: { growerId, name }
      });
      if (duplicate) {
        return NextResponse.json({ error: 'A strain with this name already exists' }, { status: 409 });
      }
    }

    const strain = await db.strain.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(genetics !== undefined && { genetics }),
        ...(description !== undefined && { description }),
        ...(growerNotes !== undefined && { growerNotes })
      }
    });

    return NextResponse.json(strain, { status: 200 });
  } catch (error) {
    console.error('Error updating strain:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a strain
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const growerId = user.growerId;

    // Verify ownership and check for related data
    const existing = await db.strain.findFirst({
      where: { id, growerId },
      include: {
        _count: { select: { products: true, batches: true } }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Strain not found' }, { status: 404 });
    }

    // Check if strain has products or batches
    if (existing._count.products > 0 || existing._count.batches > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete strain with associated products or batches' 
      }, { status: 409 });
    }

    await db.strain.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Strain deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting strain:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
