import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';

// GET all strains for the authenticated grower
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const growerId = user.growerId;

    const strains = await db.strain.findMany({
      where: { growerId },
      include: {
        batches: {
          select: { id: true, batchNumber: true, harvestDate: true }
        },
        _count: {
          select: { products: true, batches: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(strains, { status: 200 });
  } catch (error) {
    console.error('Error fetching strains:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create a new strain
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const growerId = user.growerId;
    const body = await request.json();
    const { name, genetics, description, growerNotes } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check for duplicate name
    const existing = await db.strain.findFirst({
      where: { growerId, name }
    });

    if (existing) {
      return NextResponse.json({ error: 'A strain with this name already exists' }, { status: 409 });
    }

    const strain = await db.strain.create({
      data: {
        growerId,
        name,
        genetics: genetics || null,
        description: description || null,
        growerNotes: growerNotes || null
      }
    });

    return NextResponse.json(strain, { status: 201 });
  } catch (error) {
    console.error('Error creating strain:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
