import Stripe from 'stripe';

const apiKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_SECRET_KEY;

// Lazy initialization or mock for build
const stripeInstance: Stripe | {
  checkout: { sessions: { create: (params?: unknown) => Promise<unknown> } };
  billingPortal: { sessions: { create: (params?: unknown) => Promise<unknown> } };
  webhooks: { constructEvent: () => null };
} = apiKey 
  ? new Stripe(apiKey, { apiVersion: '2025-12-30.basil' as Stripe.LatestApiVersion })
  : { 
      checkout: { sessions: { create: async () => ({}) } },
      billingPortal: { sessions: { create: async () => ({}) } },
      webhooks: { constructEvent: () => null } 
    };

export const stripe = stripeInstance;

export const STRIPE_CONFIG = {
  proPriceId: process.env.STRIPE_PRO_PRICE_ID || process.env.STRIPE_CULTIVATOR_PRO_PRICE_ID || '',
  businessPriceId: process.env.STRIPE_BUSINESS_PRICE_ID || process.env.STRIPE_CULTIVATOR_BUSINESS_PRICE_ID || '',
  getSubscriptionSuccessUrl: () => `${process.env.NEXTAUTH_URL || ''}/grower/settings?subscription=success`,
  getSubscriptionCancelUrl: () => `${process.env.NEXTAUTH_URL || ''}/grower/settings?subscription=cancelled`,
  getPortalReturnUrl: () => `${process.env.NEXTAUTH_URL || ''}/grower/settings`,
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
