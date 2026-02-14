import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';

/**
 * GET /api/stripe/account
 * Check if grower has connected Stripe account and its status
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user?.id },
      select: { growerId: true },
    });

    if (!user || !user.growerId) {
      return NextResponse.json({ error: 'Grower profile not found' }, { status: 404 });
    }

    const grower = await db.grower.findUnique({
      where: { id: user.growerId },
      select: {
        stripeAccountId: true,
        stripeAccountStatus: true,
        connectOnboardedAt: true,
        businessName: true,
      },
    });

    if (!grower?.stripeAccountId) {
      return NextResponse.json({
        connected: false,
        stripeAccountId: null,
        detailsSubmitted: false,
        chargesEnabled: false,
        payoutsEnabled: false,
      });
    }

    // Fetch account details from Stripe
    const account = await stripe.accounts.retrieve(grower.stripeAccountId);

    const detailsSubmitted = account.details_submitted;
    const chargesEnabled = account.charges_enabled;
    const payoutsEnabled = account.payouts_enabled;

    // Update local status if different
    if (grower.stripeAccountStatus !== 'active' && detailsSubmitted && chargesEnabled && payoutsEnabled) {
      await db.grower.update({
        where: { id: grower.id },
        data: {
          stripeAccountStatus: 'active',
          connectOnboardedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      connected: true,
      stripeAccountId: grower.stripeAccountId,
      detailsSubmitted,
      chargesEnabled,
      payoutsEnabled,
      businessName: grower.businessName,
      status: grower.stripeAccountStatus,
    });
  } catch (error) {
    console.error('Stripe account status error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Failed to fetch account status', message: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch account status' },
      { status: 500 }
    );
  }
}
