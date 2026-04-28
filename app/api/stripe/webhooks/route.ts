import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';

// Enable test mode when webhook secret is not configured (local dev)
// or when explicitly set to "test"
const isTestMode = !process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET === 'test';

interface StripeWebhookEvent {
  type?: string;
  data?: { object?: unknown };
}

interface StripeAccountPayload {
  id?: string;
  details_submitted?: boolean;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
}

interface StripePaymentIntentPayload {
  id?: string;
  amount?: number;
  last_payment_error?: { message?: string } | null;
}

interface StripeCheckoutSessionPayload {
  id?: string;
}

interface StripePayoutPayload {
  id?: string;
  amount?: number;
  failure_message?: string | null;
}

function asPayload<T extends object>(value: unknown): T {
  return (value && typeof value === 'object' ? value : {}) as T;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: StripeWebhookEvent | null = null;

  if (isTestMode) {
    // Test mode: parse body as JSON directly without signature verification
    try {
      event = JSON.parse(body) as StripeWebhookEvent;
      console.log('⚠️  TEST MODE: Webhook signature verification bypassed');
    } catch (err) {
      console.error('Failed to parse webhook body:', err);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
  } else {
    // Production mode: verify signature
    if (!sig) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        webhookSecret!
      ) as StripeWebhookEvent;
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }
  }

  // Handle account.updated - Stripe Connect onboarding status
  if (event?.type === 'account.updated') {
    const account = asPayload<StripeAccountPayload>(event.data?.object);

    try {
      const grower = account.id
        ? await db.grower.findFirst({ where: { stripeAccountId: account.id } })
        : null;

      if (grower) {
        const newStatus = account.details_submitted && account.charges_enabled && account.payouts_enabled
          ? 'active'
          : 'pending';

        await db.grower.update({
          where: { id: grower.id },
          data: { stripeAccountStatus: newStatus },
        });

        console.log(`Account ${account.id} status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error('Error updating account status:', error);
    }
  }

  // Handle payment_intent.succeeded
  if (event?.type === 'payment_intent.succeeded') {
    const paymentIntent = asPayload<StripePaymentIntentPayload>(event.data?.object);
    console.log(`Payment ${paymentIntent.id} succeeded for amount ${paymentIntent.amount}`);

    // TODO: Update order status in database
  }

  // Handle payment_intent.payment_failed
  if (event?.type === 'payment_intent.payment_failed') {
    const paymentIntent = asPayload<StripePaymentIntentPayload>(event.data?.object);
    console.log(`Payment ${paymentIntent.id} failed: ${paymentIntent.last_payment_error?.message}`);

    // TODO: Update order status, notify user
  }

  // Handle checkout.session.completed
  if (event?.type === 'checkout.session.completed') {
    const session = asPayload<StripeCheckoutSessionPayload>(event.data?.object);
    console.log(`Checkout session ${session.id} completed`);

    // TODO: Create order from checkout session
  }

  // Handle payout.paid
  if (event?.type === 'payout.paid') {
    const payout = asPayload<StripePayoutPayload>(event.data?.object);
    console.log(`Payout ${payout.id} completed for amount ${payout.amount}`);
  }

  // Handle payout.failed
  if (event?.type === 'payout.failed') {
    const payout = asPayload<StripePayoutPayload>(event.data?.object);
    console.log(`Payout ${payout.id} failed: ${payout.failure_message}`);
  }

  return NextResponse.json({ received: true, mode: isTestMode ? 'test' : 'production' });
}
