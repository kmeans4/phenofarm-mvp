import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import { STRAIN_TYPES, normalizeStrainType } from '@/lib/strain-types';
import { pluralize } from '@/lib/utils';

const MAX_NAME_LENGTH = 120;
const MAX_GENETICS_LENGTH = 500;
const MAX_DESCRIPTION_LENGTH = 2_000;
const MAX_NOTES_LENGTH = 2_000;

type TextResult = { value: string | null | undefined; error?: string };

function readText(value: unknown, label: string, maxLength: number, required = false): TextResult {
  if (value === undefined) {
    return required ? { value: undefined, error: `${label} is required.` } : { value: undefined };
  }
  if (value === null) {
    return required ? { value: null, error: `${label} is required.` } : { value: null };
  }
  if (typeof value !== 'string') return { value: undefined, error: `${label} must be text.` };

  const normalized = value.trim();
  if (required && !normalized) return { value: undefined, error: `${label} is required.` };
  if (normalized.length > maxLength) {
    return { value: undefined, error: `${label} must be ${maxLength} characters or fewer.` };
  }
  return { value: normalized || null };
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
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
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Request body must be an object.' }, { status: 400 });
    }

    const nameResult = readText(body.name, 'Name', MAX_NAME_LENGTH, body.name !== undefined);
    const geneticsResult = readText(body.genetics, 'Genetics', MAX_GENETICS_LENGTH);
    const descriptionResult = readText(body.description, 'Description', MAX_DESCRIPTION_LENGTH);
    const notesResult = readText(body.growerNotes, 'Grower notes', MAX_NOTES_LENGTH);
    const textError = [nameResult, geneticsResult, descriptionResult, notesResult].find((result) => result.error);
    if (textError?.error) return NextResponse.json({ error: textError.error }, { status: 400 });

    const strainType = normalizeStrainType(body.strainType);

    // Verify ownership
    const existing = await db.strain.findFirst({
      where: { id, growerId },
      select: { id: true, name: true }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Strain not found' }, { status: 404 });
    }

    if (body.strainType !== undefined && body.strainType !== null && !strainType) {
      return NextResponse.json({ error: `strainType must be one of: ${STRAIN_TYPES.join(', ')}` }, { status: 400 });
    }

    // Check for duplicate name if changing
    if (nameResult.value !== undefined && nameResult.value !== existing.name) {
      const duplicate = await db.strain.findFirst({
        where: { growerId, name: nameResult.value as string },
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
          ...(nameResult.value !== undefined && { name: nameResult.value as string }),
          ...(body.strainType !== undefined && { strainType }),
          ...(geneticsResult.value !== undefined && { genetics: geneticsResult.value }),
          ...(descriptionResult.value !== undefined && { description: descriptionResult.value }),
          ...(notesResult.value !== undefined && { growerNotes: notesResult.value })
        }
      });

      return NextResponse.json(strain, { status: 200 });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return NextResponse.json({ error: 'A strain with this name already exists' }, { status: 409 });
      }
      throw error;
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
      const blockers = [
        existing._count.products > 0 ? pluralize(existing._count.products, 'product') : '',
        existing._count.batches > 0 ? pluralize(existing._count.batches, 'batch', 'batches') : '',
      ].filter(Boolean);

      return NextResponse.json({ 
        error: `Remove or relink ${blockers.join(' and ')} first`
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
