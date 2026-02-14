import Stripe from 'stripe';

const apiKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_SECRET_KEY;

// Lazy initialization or mock for build
const stripeInstance: Stripe | {
  accounts: { create: () => Promise<unknown>; retrieve: () => Promise<unknown> };
  accountLinks: { create: () => Promise<unknown> };
  webhooks: { constructEvent: () => null };
} = apiKey 
  ? new Stripe(apiKey, { apiVersion: '2025-12-30.basil' as Stripe.LatestApiVersion })
  : { 
      accounts: { create: async () => ({}), retrieve: async () => ({}) }, 
      accountLinks: { create: async () => ({}) }, 
      webhooks: { constructEvent: () => null } 
    };

export const stripe = stripeInstance;

export const STRIPE_CONFIG = {
  platformFeePercent: 2.9,
  platformFeeFlat: 30, 
  applicationFeePercent: 1.0,
  getConnectRefreshUrl: () => `${process.env.NEXTAUTH_URL || ''}/grower/settings?stripe=refresh`,
  getConnectReturnUrl: () => `${process.env.NEXTAUTH_URL || ''}/grower/settings?stripe=success`,
};

export function calculateFees(amount: number) {
  const stripeFee = Math.round(amount * (2.9 / 100)) + 30;
  const applicationFee = Math.round(amount * 0.01);
  return { total: amount, stripeFee, applicationFee, growerGets: amount - applicationFee };
}
