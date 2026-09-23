import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import { STRAIN_TYPES, normalizeStrainType } from '@/lib/strain-types';

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

// GET all strains for the authenticated grower
export async function GET(request: NextRequest) {
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
    const summary = new URL(request.url).searchParams.get('summary') === 'true';

    if (summary) {
      const strains = await db.strain.findMany({
        where: { growerId },
        select: { id: true, name: true, genetics: true, strainType: true },
        orderBy: { name: 'asc' },
      });
      return NextResponse.json(strains, { status: 200 });
    }

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

    const user = session.user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const growerId = user.growerId;
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Request body must be an object.' }, { status: 400 });
    }

    const nameResult = readText(body.name, 'Name', MAX_NAME_LENGTH, true);
    const geneticsResult = readText(body.genetics, 'Genetics', MAX_GENETICS_LENGTH);
    const descriptionResult = readText(body.description, 'Description', MAX_DESCRIPTION_LENGTH);
    const notesResult = readText(body.growerNotes, 'Grower notes', MAX_NOTES_LENGTH);
    const textError = [nameResult, geneticsResult, descriptionResult, notesResult].find((result) => result.error);
    if (textError?.error) return NextResponse.json({ error: textError.error }, { status: 400 });

    const strainType = normalizeStrainType(body.strainType);
    if (body.strainType !== undefined && body.strainType !== null && !strainType) {
      return NextResponse.json({ error: `strainType must be one of: ${STRAIN_TYPES.join(', ')}` }, { status: 400 });
    }

    // Check for duplicate name
    const existing = await db.strain.findFirst({
      where: { growerId, name: nameResult.value as string },
      select: { id: true }
    });

    if (existing) {
      return NextResponse.json({ error: 'A strain with this name already exists' }, { status: 409 });
    }

    try {
      const strain = await db.strain.create({
        data: {
          growerId,
          name: nameResult.value as string,
          strainType,
          genetics: geneticsResult.value ?? null,
          description: descriptionResult.value ?? null,
          growerNotes: notesResult.value ?? null
        }
      });

      return NextResponse.json(strain, { status: 201 });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return NextResponse.json({ error: 'A strain with this name already exists' }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error creating strain:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
