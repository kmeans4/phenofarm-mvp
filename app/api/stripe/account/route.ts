import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';

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
      return NextResponse.json({ error: 'Grower not found' }, { status: 404 });
    }

    const grower = await db.grower.findUnique({
      where: { id: user.growerId },
      select: {
        id: true,
        businessName: true,
        stripeAccountId: true,
        stripeAccountStatus: true,
        connectOnboardedAt: true,
      },
    });

    if (!grower?.stripeAccountId) {
      return NextResponse.json({ connected: false });
    }

    // Check Stripe account status
    const account = await stripe.accounts.retrieve(grower.stripeAccountId);
    
    return NextResponse.json({
      connected: true,
      status: grower.stripeAccountStatus,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    });

  } catch (error) {
    console.error('Stripe account check error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
