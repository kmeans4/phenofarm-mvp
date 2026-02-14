import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { db } from '@/lib/db';

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
      return NextResponse.json({ error: 'Grower not found' }, { status: 404 });
    }

    const grower = await db.grower.findUnique({
      where: { id: user.growerId },
    });

    if (!grower) {
      return NextResponse.json({ error: 'Grower not found' }, { status: 404 });
    }

    if (grower.stripeAccountId) {
      return NextResponse.json(
        { error: 'Already connected', stripeAccountId: grower.stripeAccountId },
        { status: 400 }
      );
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'standard',
      email: user.email || undefined,
      business_type: 'company',
      business_profile: {
        name: grower.businessName,
        url: grower.website || undefined,
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        growerId: grower.id,
        platform: 'phenofarm',
      },
    });

    await db.grower.update({
      where: { id: grower.id },
      data: {
        stripeAccountId: account.id,
        stripeAccountStatus: 'pending',
      },
    });

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
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
