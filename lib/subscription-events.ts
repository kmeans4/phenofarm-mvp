import type Stripe from 'stripe';
import { db } from '@/lib/db';
import { getSubscriptionPlanFromPrice } from '@/lib/stripe';

const stripeId = (value: string | { id: string } | null) => typeof value === 'string' ? value : value?.id;

// Receipt and state commit together: failed processing is safe for Stripe to retry.
export async function applySubscriptionEvent(event: Stripe.Event, subscription?: Stripe.Subscription) {
  return db.$transaction(async (tx) => {
    const receipt = await tx.stripeWebhookEvent.createMany({ data: { id: event.id, type: event.type }, skipDuplicates: true });
    if (!receipt.count) return 'duplicate';
    if (event.type === 'checkout.session.completed') {
      const checkout = event.data.object as Stripe.Checkout.Session;
      if (checkout.mode !== 'subscription' || !checkout.metadata?.growerId) return 'ignored';
      // Checkout never grants access or overwrites a later subscription event.
      await tx.grower.updateMany({
        where: { id: checkout.metadata.growerId, subscriptionEventCreatedAt: { lte: event.created } },
        data: { stripeCustomerId: stripeId(checkout.customer), stripeSubscriptionId: stripeId(checkout.subscription) },
      });
      return 'processed';
    }
    if (!subscription) return 'ignored';
    const customerId = stripeId(subscription.customer);
    const growerId = subscription.metadata?.growerId;
    const item = subscription.items.data[0];
    const status = event.type === 'customer.subscription.deleted' ? 'canceled' : subscription.status;
    const plan = ['canceled', 'unpaid', 'incomplete_expired'].includes(status) ? 'free' : getSubscriptionPlanFromPrice(item?.price.id);
    const periodEnd = item?.current_period_end;
    await tx.grower.updateMany({
      where: {
        ...(growerId ? { id: growerId } : { stripeCustomerId: customerId || '__missing__' }),
        subscriptionEventCreatedAt: { lte: event.created },
      },
      data: {
        stripeCustomerId: customerId, stripeSubscriptionId: subscription.id,
        subscriptionPlan: plan, subscriptionStatus: status,
        subscriptionCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        subscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end,
        subscriptionEventCreatedAt: event.created,
      },
    });
    return 'processed';
  });
}
