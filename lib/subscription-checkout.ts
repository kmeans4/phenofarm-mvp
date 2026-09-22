import type Stripe from 'stripe';
import { db } from '@/lib/db';
import { getStripe, getSubscriptionPriceId, STRIPE_CONFIG, type SubscriptionPlan } from '@/lib/stripe';

export class SubscriptionCheckoutError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function beginSubscriptionCheckout(growerId: string, plan: SubscriptionPlan, stripe: Stripe = getStripe()) {
  const successUrl = STRIPE_CONFIG.getSubscriptionSuccessUrl();
  const cancelUrl = STRIPE_CONFIG.getSubscriptionCancelUrl();
  const priceId = getSubscriptionPriceId(plan);
  if (!priceId) throw new SubscriptionCheckoutError('This subscription plan is not configured', 503);

  return db.$transaction(async tx => {
    // Serialize requests across instances, including requests for different plans.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`subscription-checkout:${growerId}`}, 0))`;
    const grower = await tx.grower.findUnique({ where: { id: growerId }, select: {
      id: true, businessName: true, stripeCustomerId: true, stripeSubscriptionId: true,
      stripeCheckoutSessionId: true, subscriptionStatus: true, subscriptionEventCreatedAt: true,
      user: { select: { email: true } },
    } });
    if (!grower) throw new SubscriptionCheckoutError('Grower not found', 404);
    const ended = ['canceled', 'incomplete_expired', 'inactive'].includes(grower.subscriptionStatus || 'inactive');
    if (['active', 'trialing'].includes(grower.subscriptionStatus || '') || (grower.stripeSubscriptionId && !ended)) {
      throw new SubscriptionCheckoutError('Manage the existing subscription in billing settings', 409);
    }

    if (grower.stripeCheckoutSessionId) {
      const previous = await stripe.checkout.sessions.retrieve(grower.stripeCheckoutSessionId);
      if (previous.status === 'open') {
        if (previous.metadata?.plan === plan && previous.url) return previous.url;
        // Stripe atomically rejects expiration if payment completed concurrently.
        // Only create the replacement after expiration succeeds.
        await stripe.checkout.sessions.expire(previous.id);
      } else if (previous.status === 'complete') {
        const previousSubscription = typeof previous.subscription === 'string' ? previous.subscription : previous.subscription?.id;
        if (!ended || !previousSubscription || previousSubscription !== grower.stripeSubscriptionId) {
          throw new SubscriptionCheckoutError('Your completed checkout is still syncing. Please refresh billing settings.', 409);
        }
      } else if (previous.status !== 'expired') {
        throw new SubscriptionCheckoutError('The existing checkout cannot be replaced yet', 409);
      }
    }

    let customerId = grower.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: grower.user.email, name: grower.businessName, metadata: { growerId } }, { idempotencyKey: `grower-customer-${growerId}` });
      customerId = customer.id;
      await tx.grower.update({ where: { id: growerId }, data: { stripeCustomerId: customerId } });
    }
    const checkout = await stripe.checkout.sessions.create({
      mode: 'subscription', customer: customerId, client_reference_id: growerId,
      line_items: [{ price: priceId, quantity: 1 }], allow_promotion_codes: true,
      success_url: successUrl, cancel_url: cancelUrl,
      metadata: { growerId, plan }, subscription_data: { metadata: { growerId, plan } },
    }, {
      // Exclude the requested plan: an ambiguous response/transaction rollback
      // must not permit a second session with a different plan on retry.
      idempotencyKey: `grower-checkout-${growerId}-${grower.stripeCheckoutSessionId || 'initial'}-${grower.subscriptionEventCreatedAt}`,
    });
    if (!checkout.url) throw new SubscriptionCheckoutError('Stripe did not return a checkout URL', 502);
    await tx.grower.update({ where: { id: growerId }, data: { stripeCheckoutSessionId: checkout.id } });
    return checkout.url;
  }, { maxWait: 10000, timeout: 45000 });
}
