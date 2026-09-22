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

function countLabDocuments(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 0;
  const documents = (value as { labDocuments?: unknown }).labDocuments;
  if (!documents || typeof documents !== 'object' || Array.isArray(documents)) return 0;
  return Object.values(documents).filter((document) => document && typeof document === 'object').length;
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

// GET all batches for the authenticated grower. Lab document payloads are
// intentionally reduced to a count; individual GET remains the editor path.
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user;
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const growerId = user.growerId;
    const strainId = new URL(request.url).searchParams.get('strainId');
    const rows = await db.batch.findMany({
      where: { growerId, ...(strainId ? { strainId } : {}) },
      select: {
        id: true,
        batchNumber: true,
        lotNumber: true,
        harvestDate: true,
        strainId: true,
        thc: true,
        cbd: true,
        totalCannabinoids: true,
        terpenes: true,
        coaDocumentUrl: true,
        notes: true,
        growerId: true,
        createdAt: true,
        updatedAt: true,
        testResults: true,
        strain: { select: { id: true, name: true, genetics: true } },
        _count: { select: { products: true } },
      },
      orderBy: { harvestDate: 'desc' },
    });

    const batches = rows.map(({ testResults, ...batch }) => ({
      ...batch,
      labDocumentCount: countLabDocuments(testResults),
    }));
    return NextResponse.json(batches, { status: 200 });
  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create a new batch
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user;
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const growerId = user.growerId;
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Request body must be an object.' }, { status: 400 });
    }

    const batchNumberResult = readText(body.batchNumber, 'Batch number', MAX_BATCH_NUMBER_LENGTH, true);
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

    const harvestDateInput = normalizeHarvestDate(body.harvestDate);
    if (!harvestDateInput) {
      return NextResponse.json({ error: 'Harvest date must be a valid date.' }, { status: 400 });
    }
    if (isFutureDateInput(harvestDateInput)) {
      return NextResponse.json({ error: 'Harvest date cannot be in the future' }, { status: 400 });
    }

    const strainIdResult = readText(body.strainId, 'Strain', 120, true);
    if (strainIdResult.error) return NextResponse.json({ error: strainIdResult.error }, { status: 400 });

    const terpenesError = validateJson(body.terpenes, 'terpenes', MAX_TERPENES_JSON_LENGTH);
    if (terpenesError) return NextResponse.json({ error: terpenesError }, { status: 400 });

    const coaValidation = validateDocumentReference(body.coaDocumentUrl);
    if (!coaValidation.ok) return NextResponse.json({ error: coaValidation.error }, { status: 400 });

    const labResults = await normalizeLabDocuments(body.testResults, growerId);
    if (labResults.error) return NextResponse.json({ error: labResults.error }, { status: 400 });

    const strain = await db.strain.findFirst({
      where: { id: strainIdResult.value as string, growerId },
      select: { id: true },
    });
    if (!strain) return NextResponse.json({ error: 'Strain not found' }, { status: 404 });

    const normalizedBatchNumber = batchNumberResult.value as string;
    const existing = await db.batch.findFirst({
      where: { growerId, batchNumber: normalizedBatchNumber },
      select: { id: true },
    });
    if (existing) return NextResponse.json({ error: 'A batch with this number already exists' }, { status: 409 });

    try {
      const batch = await db.batch.create({
        data: {
          growerId,
          batchNumber: normalizedBatchNumber,
          lotNumber: lotNumberResult.value ?? null,
          harvestDate: new Date(`${harvestDateInput}T00:00:00.000Z`),
          strainId: strainIdResult.value as string,
          thc: metricResults[0].value ?? null,
          cbd: metricResults[1].value ?? null,
          totalCannabinoids: metricResults[2].value ?? null,
          terpenes: body.terpenes === undefined || body.terpenes === null
            ? Prisma.JsonNull
            : body.terpenes,
          coaDocumentUrl: body.coaDocumentUrl || null,
          testResults: labResults.value === undefined || labResults.value === null
            ? Prisma.JsonNull
            : labResults.value,
          notes: notesResult.value ?? null,
        },
      });
      return NextResponse.json(batch, { status: 201 });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return NextResponse.json({ error: 'A batch with this number already exists' }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error creating batch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
