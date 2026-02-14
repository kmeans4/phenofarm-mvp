import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { db } from '@/lib/db';

/**
 * POST /api/stripe/connect
 * Create a Stripe Connect account and return onboarding URL
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user?.id },
      select: { growerId: true, email: true, name: true },
    });

    if (!user || !user.growerId) {
      return NextResponse.json({ error: 'Grower profile not found' }, { status: 404 });
    }

    const grower = await db.grower.findUnique({
      where: { id: user.growerId },
    });

    if (!grower) {
      return NextResponse.json({ error: 'Grower record not found' }, { status: 404 });
    }

    // Check if account already exists
    if (grower.stripeAccountId) {
      return NextResponse.json(
        { error: 'Account already connected', stripeAccountId: grower.stripeAccountId },
        { status: 400 }
      );
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'standard', // or 'express' for a more streamlined experience
      email: user.email,
      business_type: 'company',
      business_profile: {
        name: grower.businessName,
        url: grower.website || 'https://phenofarm.app',
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'weekly',
            weekly_anchor: 'monday',
          },
          metadata: {
            minimum_payment_amount: 1000,
          },
        },
      },
    });

    // Update grower record with Stripe account ID
    await db.grower.update({
      where: { id: grower.id },
      data: {
        stripeAccountId: account.id,
        stripeAccountStatus: 'pending',
      },
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: STRIPE_CONFIG.getConnectRefreshUrl(),
      return_url: STRIPE_CONFIG.getConnectReturnUrl(),
      type: 'account_onboarding',
    });

    return NextResponse.json({
      success: true,
      url: accountLink.url,
      stripeAccountId: account.id,
    });
  } catch (error) {
    console.error('Stripe Connect error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Failed to create Stripe account', message: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create Stripe account' },
      { status: 500 }
    );
  }
}
