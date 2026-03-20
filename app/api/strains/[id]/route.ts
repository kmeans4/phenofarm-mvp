import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import { normalizeStrainType } from '@/lib/strain-types';

function isMissingStrainTypeColumnError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2022' && String(error.meta?.column ?? '').includes('strainType')) {
      return true;
    }

    if (error.code === 'P2010') {
      const message = String(error.message ?? '').toLowerCase();
      if (message.includes('straintype') && message.includes('does not exist')) {
        return true;
      }
    }
  }

  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return message.includes('straintype') && (message.includes('does not exist') || message.includes('unknown column'));
}

function withNullStrainType<T extends object>(strain: T): T & { strainType: null } {
  return {
    ...strain,
    strainType: null
  };
}

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

    try {
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
      if (!isMissingStrainTypeColumnError(error)) {
        throw error;
      }

      const strain = await db.strain.findFirst({
        where: { id, growerId },
        select: {
          id: true,
          name: true,
          genetics: true,
          description: true,
          growerNotes: true,
          growerId: true,
          createdAt: true,
          updatedAt: true,
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

      return NextResponse.json(withNullStrainType(strain), { status: 200 });
    }
  } catch (error) {
    console.error('Error fetching strain:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update a strain
export async function PUT(
  _request: NextRequest,
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
    const strainType = normalizeStrainType(body?.strainType);

    // Verify ownership
    const existing = await db.strain.findFirst({
      where: { id, growerId },
      select: { id: true, name: true }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Strain not found' }, { status: 404 });
    }

    if (body?.strainType !== undefined && body?.strainType !== null && !strainType) {
      return NextResponse.json({ error: 'strainType must be one of: INDICA, SATIVA, HYBRID' }, { status: 400 });
    }

    // Check for duplicate name if changing
    if (name && name !== existing.name) {
      const duplicate = await db.strain.findFirst({
        where: { growerId, name },
        select: { id: true }
      });
      if (duplicate) {
        return NextResponse.json({ error: 'A strain with this name already exists' }, { status: 409 });
      }
    }

    try {
      const strain = await db.strain.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(body?.strainType !== undefined && { strainType }),
          ...(genetics !== undefined && { genetics }),
          ...(description !== undefined && { description }),
          ...(growerNotes !== undefined && { growerNotes })
        }
      });

      return NextResponse.json(strain, { status: 200 });
    } catch (error) {
      if (!isMissingStrainTypeColumnError(error)) {
        throw error;
      }

      const strain = await db.strain.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(genetics !== undefined && { genetics }),
          ...(description !== undefined && { description }),
          ...(growerNotes !== undefined && { growerNotes })
        },
        select: {
          id: true,
          name: true,
          genetics: true,
          description: true,
          growerNotes: true,
          growerId: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return NextResponse.json(withNullStrainType(strain), { status: 200 });
    }
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
      select: {
        id: true,
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
      where: { id },
      select: { id: true }
    });

    return NextResponse.json({ message: 'Strain deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting strain:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
