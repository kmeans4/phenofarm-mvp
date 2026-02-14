import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

export const STRIPE_CONFIG = {
  platformFeePercent: 2.9,
  platformFeeFlat: 30, // cents
  applicationFeePercent: 1.0,
  getConnectRefreshUrl: () => `${process.env.NEXTAUTH_URL}/grower/settings?stripe=refresh`,
  getConnectReturnUrl: () => `${process.env.NEXTAUTH_URL}/grower/settings?stripe=success`,
};

export function calculateFees(amount: number) {
  const stripeFee = Math.round(amount * (STRIPE_CONFIG.platformFeePercent / 100)) + STRIPE_CONFIG.platformFeeFlat;
  const applicationFee = Math.round(amount * (STRIPE_CONFIG.applicationFeePercent / 100));
  const growerGets = amount - applicationFee;
  
  return { total: amount, stripeFee, applicationFee, growerGets };
}
