import Stripe from 'stripe';

let client: Stripe | undefined;
export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_SECRET_KEY);
}
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_SECRET_KEY;
  if (!key) throw new Error('Stripe Billing is not configured');
  // Pin the real API version supported by the installed SDK; no mock success path.
  return client ??= new Stripe(key, { apiVersion: '2026-01-28.clover', timeout: 10000 });
}
function appOrigin() {
  const value = process.env.NEXTAUTH_URL;
  if (!value) throw new Error('NEXTAUTH_URL is required for billing');
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid billing origin');
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') throw new Error('Billing requires an HTTPS origin');
  return url.origin;
}

export const STRIPE_CONFIG = {
  proPriceId: process.env.STRIPE_PRO_PRICE_ID || process.env.STRIPE_CULTIVATOR_PRO_PRICE_ID || '',
  businessPriceId: process.env.STRIPE_BUSINESS_PRICE_ID || process.env.STRIPE_CULTIVATOR_BUSINESS_PRICE_ID || '',
  getSubscriptionSuccessUrl: () => `${appOrigin()}/grower/settings?subscription=success`,
  getSubscriptionCancelUrl: () => `${appOrigin()}/grower/settings?subscription=cancelled`,
  getPortalReturnUrl: () => `${appOrigin()}/grower/settings`,
};

export type SubscriptionPlan = 'pro' | 'business';

export function getSubscriptionPriceId(plan: SubscriptionPlan) {
  return plan === 'business' ? STRIPE_CONFIG.businessPriceId : STRIPE_CONFIG.proPriceId;
}

export function getSubscriptionPlanFromPrice(priceId?: string | null): SubscriptionPlan | 'free' {
  if (priceId && priceId === STRIPE_CONFIG.businessPriceId) return 'business';
  if (priceId && priceId === STRIPE_CONFIG.proPriceId) return 'pro';
  return 'free';
}
