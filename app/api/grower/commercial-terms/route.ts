import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { type CommercialTermsDefaults } from '@/lib/ux-workflow';

const MAX_TERM_LENGTH = 240;
const MAX_NOTE_LENGTH = 500;

function normalizeTerm(
  value: unknown,
  fallback: string,
  maxLength = MAX_TERM_LENGTH
) {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'string') {
    throw new Error('Commercial terms must be text');
  }

  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new Error(`Commercial terms must be ${maxLength} characters or less`);
  }

  return trimmed;
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
      minimumOrder: grower.commercialMinimumOrder || '',
      fulfillmentMethods: grower.commercialFulfillmentMethods || '',
      fulfillmentRegion: grower.commercialFulfillmentRegion || '',
      paymentTerms: grower.commercialPaymentTerms || '',
      responseWindow: grower.commercialResponseWindow || '',
      contactNote: grower.commercialContactNote || '',
    },
    savedAt: grower.commercialTermsUpdatedAt?.toISOString() || null,
  };
}

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Please sign in to continue.' },
        { status: 401 }
      );
    }

    const user = session.user;

    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json(
        { error: 'Your account does not have access to this action.' },
        { status: 403 }
      );
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
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Please sign in to continue.' },
        { status: 401 }
      );
    }

    const user = session.user;

    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json(
        { error: 'Your account does not have access to this action.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const incomingTerms = (body?.terms ||
      body ||
      {}) as Partial<CommercialTermsDefaults>;

    let terms: CommercialTermsDefaults;
    try {
      terms = {
        minimumOrder: normalizeTerm(incomingTerms.minimumOrder, ''),
        fulfillmentMethods: normalizeTerm(incomingTerms.fulfillmentMethods, ''),
        fulfillmentRegion: normalizeTerm(incomingTerms.fulfillmentRegion, ''),
        paymentTerms: normalizeTerm(incomingTerms.paymentTerms, ''),
        responseWindow: normalizeTerm(incomingTerms.responseWindow, ''),
        contactNote: normalizeTerm(
          incomingTerms.contactNote,
          '',
          MAX_NOTE_LENGTH
        ),
      };
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : 'Invalid commercial terms',
        },
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
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
