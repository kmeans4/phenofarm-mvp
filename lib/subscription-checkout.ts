import type Stripe from 'stripe';
import type { SubscriptionPlan } from '@/lib/stripe';
import { BILLING_DISABLED_MESSAGE } from '@/lib/seller-access';
export class SubscriptionCheckoutError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}
export async function beginSubscriptionCheckout(
  _growerId: string,
  _plan: SubscriptionPlan,
  _stripe?: Stripe
): Promise<string> {
  void _growerId;
  void _plan;
  void _stripe;
  throw new SubscriptionCheckoutError(BILLING_DISABLED_MESSAGE, 503);
}
