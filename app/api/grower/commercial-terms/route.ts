import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { DEFAULT_COMMERCIAL_TERMS, type CommercialTermsDefaults } from '@/lib/ux-workflow';

const MAX_TERM_LENGTH = 240;
const MAX_NOTE_LENGTH = 500;

function normalizeTerm(value: unknown, fallback: string, maxLength = MAX_TERM_LENGTH) {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'string') {
    throw new Error('Commercial terms must be text');
  }

  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new Error(`Commercial terms must be ${maxLength} characters or less`);
  }

  return trimmed || fallback;
}

function serializeTerms(grower: {
  commercialMinimumOrder: string | null;
  commercialFulfillmentMethods: string | null;
  commercialFulfillmentRegion: string | null;
  commercialPaymentTerms: string | null;
  commercialResponseWindow: string | null;
  commercialContactNote: string | null;
  commercialTermsUpdatedAt: Date | null;
}) {
  return {
    terms: {
      minimumOrder: grower.commercialMinimumOrder || DEFAULT_COMMERCIAL_TERMS.minimumOrder,
      fulfillmentMethods: grower.commercialFulfillmentMethods || DEFAULT_COMMERCIAL_TERMS.fulfillmentMethods,
      fulfillmentRegion: grower.commercialFulfillmentRegion || DEFAULT_COMMERCIAL_TERMS.fulfillmentRegion,
      paymentTerms: grower.commercialPaymentTerms || DEFAULT_COMMERCIAL_TERMS.paymentTerms,
      responseWindow: grower.commercialResponseWindow || DEFAULT_COMMERCIAL_TERMS.responseWindow,
      contactNote: grower.commercialContactNote || DEFAULT_COMMERCIAL_TERMS.contactNote,
    },
    savedAt: grower.commercialTermsUpdatedAt?.toISOString() || null,
  };
}

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

    const grower = await db.grower.findUnique({
      where: { id: user.growerId },
      select: {
        commercialMinimumOrder: true,
        commercialFulfillmentMethods: true,
        commercialFulfillmentRegion: true,
        commercialPaymentTerms: true,
        commercialResponseWindow: true,
        commercialContactNote: true,
        commercialTermsUpdatedAt: true,
      },
    });

    if (!grower) {
      return NextResponse.json({ error: 'Grower not found' }, { status: 404 });
    }

    return NextResponse.json(serializeTerms(grower));
  } catch (error) {
    console.error('Error fetching commercial terms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;

    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const incomingTerms = (body?.terms || body || {}) as Partial<CommercialTermsDefaults>;

    let terms: CommercialTermsDefaults;
    try {
      terms = {
        minimumOrder: normalizeTerm(incomingTerms.minimumOrder, DEFAULT_COMMERCIAL_TERMS.minimumOrder),
        fulfillmentMethods: normalizeTerm(incomingTerms.fulfillmentMethods, DEFAULT_COMMERCIAL_TERMS.fulfillmentMethods),
        fulfillmentRegion: normalizeTerm(incomingTerms.fulfillmentRegion, DEFAULT_COMMERCIAL_TERMS.fulfillmentRegion),
        paymentTerms: normalizeTerm(incomingTerms.paymentTerms, DEFAULT_COMMERCIAL_TERMS.paymentTerms),
        responseWindow: normalizeTerm(incomingTerms.responseWindow, DEFAULT_COMMERCIAL_TERMS.responseWindow),
        contactNote: normalizeTerm(incomingTerms.contactNote, DEFAULT_COMMERCIAL_TERMS.contactNote, MAX_NOTE_LENGTH),
      };
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid commercial terms' },
        { status: 400 }
      );
    }

    const grower = await db.grower.update({
      where: { id: user.growerId },
      data: {
        commercialMinimumOrder: terms.minimumOrder,
        commercialFulfillmentMethods: terms.fulfillmentMethods,
        commercialFulfillmentRegion: terms.fulfillmentRegion,
        commercialPaymentTerms: terms.paymentTerms,
        commercialResponseWindow: terms.responseWindow,
        commercialContactNote: terms.contactNote,
        commercialTermsUpdatedAt: new Date(),
      },
      select: {
        commercialMinimumOrder: true,
        commercialFulfillmentMethods: true,
        commercialFulfillmentRegion: true,
        commercialPaymentTerms: true,
        commercialResponseWindow: true,
        commercialContactNote: true,
        commercialTermsUpdatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Commercial terms saved',
      ...serializeTerms(grower),
    });
  } catch (error) {
    console.error('Error updating commercial terms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
