import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: any;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      webhookSecret!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  if (event?.type === 'account.updated') {
    const account: any = event.data.object;
    
    try {
      const grower = await db.grower.findFirst({
        where: { stripeAccountId: account.id },
      });

      if (grower) {
        const newStatus = account.details_submitted && account.charges_enabled && account.payouts_enabled
          ? 'active'
          : 'pending';

        await db.grower.update({
          where: { id: grower.id },
          data: { stripeAccountStatus: newStatus },
        });

        console.log(`Account ${account.id} status updated`);
      }
    } catch (error) {
      console.error('Error updating account status:', error);
    }
  }

  if (event?.type === 'payment_intent.succeeded') {
    const paymentIntent: any = event.data.object;
    console.log(`Payment ${paymentIntent.id} succeeded`);
  }

  if (event?.type === 'payout.paid') {
    const payout: any = event.data.object;
    console.log(`Payout ${payout.id} completed`);
  }

  return NextResponse.json({ received: true });
}
