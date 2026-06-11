import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionPlanFromPrice, stripe } from '@/lib/stripe';
import { db } from '@/lib/db';

// Unsigned "test mode" payloads are only ever accepted outside production.
// In production a missing webhook secret must fail closed, not skip verification.
const isProduction = process.env.NODE_ENV === 'production';
const isTestMode = !isProduction &&
  (!process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET === 'test');

interface StripeWebhookEvent {
  type?: string;
  data?: { object?: unknown };
}

interface StripeCheckoutSessionPayload {
  id?: string;
  mode?: string | null;
  customer?: string | { id?: string } | null;
  subscription?: string | { id?: string } | null;
  metadata?: {
    growerId?: string;
    plan?: string;
  } | null;
}

interface StripeSubscriptionPayload {
  id?: string;
  status?: string;
  customer?: string | { id?: string } | null;
  current_period_end?: number | null;
  cancel_at_period_end?: boolean;
  metadata?: {
    growerId?: string;
    plan?: string;
  } | null;
  items?: {
    data?: Array<{
      price?: { id?: string | null };
    }>;
  };
}

function asPayload<T extends object>(value: unknown): T {
  return (value && typeof value === 'object' ? value : {}) as T;
}

function getStripeId(value: string | { id?: string } | null | undefined) {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id || null;
}

function getPeriodEnd(value?: number | null) {
  return value ? new Date(value * 1000) : null;
}

async function updateGrowerSubscription(subscription: StripeSubscriptionPayload) {
  const subscriptionId = subscription.id;
  const customerId = getStripeId(subscription.customer);
  const growerId = subscription.metadata?.growerId;
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const plan = subscription.metadata?.plan || getSubscriptionPlanFromPrice(priceId);

  const where = growerId
    ? { id: growerId }
    : subscriptionId
      ? { stripeSubscriptionId: subscriptionId }
      : customerId
        ? { stripeCustomerId: customerId }
        : null;

  if (!where) return;

  await db.grower.updateMany({
    where,
    data: {
      stripeCustomerId: customerId || undefined,
      stripeSubscriptionId: subscriptionId || undefined,
      subscriptionPlan: plan,
      subscriptionStatus: subscription.status || 'inactive',
      subscriptionCurrentPeriodEnd: getPeriodEnd(subscription.current_period_end),
      subscriptionCancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    },
  });
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

  if (event?.type === 'checkout.session.completed') {
    const session = asPayload<StripeCheckoutSessionPayload>(event.data?.object);
    if (session.mode === 'subscription' && session.metadata?.growerId) {
      await db.grower.update({
        where: { id: session.metadata.growerId },
        data: {
          stripeCustomerId: getStripeId(session.customer) || undefined,
          stripeSubscriptionId: getStripeId(session.subscription) || undefined,
          subscriptionPlan: session.metadata.plan || 'pro',
          subscriptionStatus: 'active',
        },
      });
      console.log(`Subscription checkout session ${session.id} completed for grower ${session.metadata.growerId}`);
    } else {
      console.log(`Ignored non-subscription checkout session ${session.id}`);
    }
  }

  if (
    event?.type === 'customer.subscription.created' ||
    event?.type === 'customer.subscription.updated' ||
    event?.type === 'customer.subscription.deleted'
  ) {
    try {
      await updateGrowerSubscription(asPayload<StripeSubscriptionPayload>(event.data?.object));
    } catch (error) {
      console.error('Error updating subscription status:', error);
    }
  }

  if (
    event?.type?.startsWith('account.') ||
    event?.type?.startsWith('payment_intent.') ||
    event?.type?.startsWith('payout.')
  ) {
    console.log(`Ignored Stripe marketplace payment event ${event.type}; PhenoFarm only processes subscriptions.`);
  }

  return NextResponse.json({ received: true, mode: isTestMode ? 'test' : 'production' });
}
