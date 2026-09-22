import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, isStripeConfigured } from '@/lib/stripe';
import { applySubscriptionEvent } from '@/lib/subscription-events';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!isStripeConfigured() || !secret || secret === 'test') {
    return NextResponse.json({ error: 'Stripe webhook is not configured' }, { status: 503 });
  }
  const signature = req.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }
  try {
    if (await db.stripeWebhookEvent.findUnique({ where: { id: event.id }, select: { id: true } })) {
      return NextResponse.json({ received: true });
    }
    let subscription: Stripe.Subscription | undefined;
    if (['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
      const payload = event.data.object as Stripe.Subscription;
      // A canonical read resolves same-second events and stale snapshot deliveries.
      subscription = event.type === 'customer.subscription.deleted' ? payload : await getStripe().subscriptions.retrieve(payload.id);
    }
    await applySubscriptionEvent(event, subscription);
    return NextResponse.json({ received: true });
  } catch {
    // Do not acknowledge failures: Stripe must retry a rolled-back update.
    return NextResponse.json({ error: 'Unable to process billing event' }, { status: 500 });
  }
}
