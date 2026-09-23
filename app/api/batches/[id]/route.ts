import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import { persistLabDocuments } from '@/lib/blob-storage';
import { validateBatchLabDocumentsPayload, validateDocumentReference } from '@/lib/upload-validation';
import { isFutureDateInput } from '@/lib/batch-utils';

const MAX_BATCH_NUMBER_LENGTH = 120;
const MAX_LOT_NUMBER_LENGTH = 120;
const MAX_NOTES_LENGTH = 2_000;
const MAX_TERPENES_JSON_LENGTH = 50_000;
const MAX_TEST_RESULTS_JSON_LENGTH = 100_000;

type TextResult = { value: string | null | undefined; error?: string };
type MetricResult = { value: number | null | undefined; error?: string };

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

function readMetric(value: unknown, label: string): MetricResult {
  if (value === undefined) return { value: undefined };
  if (value === null || (typeof value === 'string' && !value.trim())) return { value: null };

  const numeric = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? Number(value.trim())
      : Number.NaN;

  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100) {
    return { value: undefined, error: `${label} must be a finite number between 0 and 100.` };
  }
  return { value: numeric };
}

function normalizeHarvestDate(value: unknown) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10);
  }
  if (typeof value !== 'string') return '';

  const raw = value.trim();
  if (!raw) return '';
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const parsed = new Date(dateOnly ? `${raw}T00:00:00.000Z` : raw);
  if (Number.isNaN(parsed.getTime())) return '';

  const normalized = parsed.toISOString().slice(0, 10);
  return dateOnly && normalized !== raw ? '' : normalized;
}

function validateJson(value: unknown, label: string, maxLength: number) {
  if (value === undefined || value === null) return null;
  try {
    const serialized = JSON.stringify(value);
    if (!serialized || serialized.length > maxLength) {
      return `${label} must be valid JSON of ${maxLength} characters or fewer.`;
    }
  } catch {
    return `${label} must be valid JSON.`;
  }
  return null;
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

async function normalizeLabDocuments(value: unknown, growerId: string) {
  const validation = validateBatchLabDocumentsPayload(value);
  if (!validation.ok) return { error: validation.error };

  const persisted = await persistLabDocuments(value, `growers/${growerId}/batches/lab-documents`);
  const jsonError = validateJson(persisted, 'testResults', MAX_TEST_RESULTS_JSON_LENGTH);
  if (jsonError) return { error: jsonError };
  return { value: persisted };
}

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

    const user = session.user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const growerId = user.growerId;

    const batch = await db.batch.findFirst({
      where: { id, growerId },
      include: {
        strain: { select: { id: true, name: true, genetics: true } },
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

    // Verify ownership
    const existing = await db.batch.findFirst({
      where: { id, growerId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    const batchNumberResult = readText(body.batchNumber, 'Batch number', MAX_BATCH_NUMBER_LENGTH, body.batchNumber !== undefined);
    const lotNumberResult = readText(body.lotNumber, 'Lot number', MAX_LOT_NUMBER_LENGTH);
    const notesResult = readText(body.notes, 'Notes', MAX_NOTES_LENGTH);
    const metricResults = [
      readMetric(body.thc, 'THC'),
      readMetric(body.cbd, 'CBD'),
      readMetric(body.totalCannabinoids, 'Total cannabinoids'),
    ];
    const textError = [batchNumberResult, lotNumberResult, notesResult].find((result) => result.error);
    const metricError = metricResults.find((result) => result.error);
    if (textError?.error || metricError?.error) {
      return NextResponse.json({ error: textError?.error || metricError?.error }, { status: 400 });
    }

    const harvestDateInput = body.harvestDate === undefined ? '' : normalizeHarvestDate(body.harvestDate);
    if (body.harvestDate !== undefined && !harvestDateInput) {
      return NextResponse.json({ error: 'Harvest date must be a valid date.' }, { status: 400 });
    }

    if (harvestDateInput && isFutureDateInput(harvestDateInput)) {
      return NextResponse.json({ error: 'Harvest date cannot be in the future' }, { status: 400 });
    }

    // Check for duplicate batch number if changing
    if (batchNumberResult.value !== undefined && batchNumberResult.value !== existing.batchNumber) {
      const duplicate = await db.batch.findFirst({
        where: { growerId, batchNumber: batchNumberResult.value as string }
      });
      if (duplicate) {
        return NextResponse.json({ error: 'A batch with this number already exists' }, { status: 409 });
      }
    }

    const coaValidation = validateDocumentReference(body.coaDocumentUrl);
    if (!coaValidation.ok) {
      return NextResponse.json({ error: coaValidation.error }, { status: 400 });
    }

    const terpenesError = validateJson(body.terpenes, 'terpenes', MAX_TERPENES_JSON_LENGTH);
    if (terpenesError) return NextResponse.json({ error: terpenesError }, { status: 400 });

    const labResults = body.testResults === undefined
      ? { value: undefined }
      : await normalizeLabDocuments(body.testResults, growerId);
    if (labResults.error) return NextResponse.json({ error: labResults.error }, { status: 400 });

    // Verify strain if being changed
    const strainIdResult = readText(body.strainId, 'Strain', 120, body.strainId !== undefined);
    if (strainIdResult.error) return NextResponse.json({ error: strainIdResult.error }, { status: 400 });
    if (strainIdResult.value !== undefined && strainIdResult.value !== existing.strainId) {
      const strain = await db.strain.findFirst({
        where: { id: strainIdResult.value as string, growerId },
        select: { id: true }
      });
      if (!strain) {
        return NextResponse.json({ error: 'Strain not found' }, { status: 404 });
      }
    }

    try {
      const batch = await db.batch.update({
        where: { id },
        data: {
          ...(batchNumberResult.value !== undefined && { batchNumber: batchNumberResult.value as string }),
          ...(lotNumberResult.value !== undefined && { lotNumber: lotNumberResult.value }),
          ...(harvestDateInput && { harvestDate: new Date(`${harvestDateInput}T00:00:00.000Z`) }),
          ...(strainIdResult.value !== undefined && {
            strain: { connect: { id: strainIdResult.value as string } },
          }),
          ...(metricResults[0].value !== undefined && { thc: metricResults[0].value }),
          ...(metricResults[1].value !== undefined && { cbd: metricResults[1].value }),
          ...(metricResults[2].value !== undefined && { totalCannabinoids: metricResults[2].value }),
          ...(body.terpenes !== undefined && {
            terpenes: body.terpenes === null ? Prisma.JsonNull : body.terpenes,
          }),
          ...(body.coaDocumentUrl !== undefined && { coaDocumentUrl: body.coaDocumentUrl }),
          ...(body.testResults !== undefined && {
            testResults: labResults.value === undefined || labResults.value === null
              ? Prisma.JsonNull
              : labResults.value,
          }),
          ...(notesResult.value !== undefined && { notes: notesResult.value }),
        }
      });

      return NextResponse.json(batch, { status: 200 });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return NextResponse.json({ error: 'A batch with this number already exists' }, { status: 409 });
      }
      throw error;
    }
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

    const user = session.user;
    
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
