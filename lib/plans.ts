export type GrowerPlanId = 'free' | 'seller';
export const SELLER_PLAN = {
  monthlyCents: 16500,
  annualCents: 120000,
} as const;
export interface GrowerPlanSource {
  subscriptionPlan?: string | null;
  subscriptionStatus?: string | null;
  subscriptionCurrentPeriodEnd?: Date | string | null;
}
export function hasActiveSubscription(
  grower: GrowerPlanSource | null | undefined,
  now = new Date()
) {
  if (
    !grower ||
    !['seller', 'pro', 'business'].includes(
      grower.subscriptionPlan?.toLowerCase() || ''
    ) ||
    !['active', 'trialing'].includes(
      grower.subscriptionStatus?.toLowerCase() || ''
    )
  )
    return false;
  if (!grower.subscriptionCurrentPeriodEnd) return true;
  const end = new Date(grower.subscriptionCurrentPeriodEnd).getTime();
  return Number.isFinite(end) && end > now.getTime();
}
export function getGrowerPlan(grower?: GrowerPlanSource | null): GrowerPlanId {
  return hasActiveSubscription(grower) ? 'seller' : 'free';
}
export const PLAN_LIMITS = {
  free: { maxActiveListings: null, csvImport: true, advancedAnalytics: false },
  seller: {
    maxActiveListings: null,
    csvImport: true,
    advancedAnalytics: false,
  },
} as const;
export function getGrowerPlanLimits(grower?: GrowerPlanSource | null) {
  const plan = getGrowerPlan(grower);
  return { plan, ...PLAN_LIMITS[plan] };
}
export const FREE_LISTING_LIMIT_MESSAGE =
  'Catalog access is unavailable. Contact support.';
export function canCreateListings(
  _grower: GrowerPlanSource | null | undefined,
  _currentListingCount: number,
  _requestedCount = 1
) {
  void _grower;
  void _currentListingCount;
  void _requestedCount;
  return true;
}
export const PLAN_PRESENTATION = [
  {
    id: 'free',
    name: 'Prepare your catalog',
    price: '$0',
    priceDetail: '',
    description: 'Set up your business and products for free.',
    features: [
      'Unlimited drafts and product listings',
      'Spreadsheet imports and stock management',
      'Products stay hidden until your subscription is active',
    ],
  },
  {
    id: 'seller',
    name: 'Seller subscription',
    price: '$165',
    priceDetail: 'per month, or $1,200 per year paid upfront',
    description: 'Make your products available to verified dispensaries.',
    features: [
      'Buyer visibility with an active subscription and approved license',
      'Price requests, quotes and wholesale orders',
      'Customer history and delivered-order reports',
    ],
  },
] as const;
