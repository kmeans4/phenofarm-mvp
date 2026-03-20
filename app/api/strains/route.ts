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

// GET all strains for the authenticated grower
export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const growerId = user.growerId;

    try {
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
      if (!isMissingStrainTypeColumnError(error)) {
        throw error;
      }

      const strains = await db.strain.findMany({
        where: { growerId },
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
            select: { id: true, batchNumber: true, harvestDate: true }
          },
          _count: {
            select: { products: true, batches: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      return NextResponse.json(strains.map(withNullStrainType), { status: 200 });
    }
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

    const user = session.user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const growerId = user.growerId;
    const body = await request.json();
    const { name, genetics, description, growerNotes } = body;
    const strainType = normalizeStrainType(body?.strainType);

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (body?.strainType !== undefined && body?.strainType !== null && !strainType) {
      return NextResponse.json({ error: 'strainType must be one of: INDICA, SATIVA, HYBRID' }, { status: 400 });
    }

    // Check for duplicate name
    const existing = await db.strain.findFirst({
      where: { growerId, name },
      select: { id: true }
    });

    if (existing) {
      return NextResponse.json({ error: 'A strain with this name already exists' }, { status: 409 });
    }

    try {
      const strain = await db.strain.create({
        data: {
          growerId,
          name,
          strainType,
          genetics: genetics || null,
          description: description || null,
          growerNotes: growerNotes || null
        }
      });

      return NextResponse.json(strain, { status: 201 });
    } catch (error) {
      if (!isMissingStrainTypeColumnError(error)) {
        throw error;
      }

      const strain = await db.strain.create({
        data: {
          growerId,
          name,
          genetics: genetics || null,
          description: description || null,
          growerNotes: growerNotes || null
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

      return NextResponse.json(withNullStrainType(strain), { status: 201 });
    }
  } catch (error) {
    console.error('Error creating strain:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
