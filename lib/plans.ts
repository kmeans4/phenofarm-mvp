export type GrowerPlanId = 'free' | 'pro' | 'business';

export const PLAN_LIMITS = {
  free: {
    maxActiveListings: 50,
    csvImport: false,
    advancedAnalytics: false,
  },
  pro: {
    maxActiveListings: null,
    csvImport: true,
    advancedAnalytics: false,
  },
  business: {
    maxActiveListings: null,
    csvImport: true,
    advancedAnalytics: false,
  },
} as const;

interface GrowerPlanSource {
  subscriptionPlan?: string | null;
  subscriptionStatus?: string | null;
}

export function getGrowerPlan(
  grower: GrowerPlanSource | null | undefined
): GrowerPlanId {
  const plan = grower?.subscriptionPlan?.toLowerCase();
  const status = grower?.subscriptionStatus?.toLowerCase();

  if (status !== 'active' && status !== 'trialing') {
    return 'free';
  }

  if (plan === 'pro' || plan === 'business') return plan;
  return 'free';
}

export function getGrowerPlanLimits(
  grower: GrowerPlanSource | null | undefined
) {
  const plan = getGrowerPlan(grower);
  return { plan, ...PLAN_LIMITS[plan] };
}

export const FREE_LISTING_LIMIT_MESSAGE =
  'Free plan includes 50 listings - upgrade to Pro';

export function canCreateListings(
  grower: GrowerPlanSource | null | undefined,
  currentListingCount: number,
  requestedCount = 1
) {
  const limits = getGrowerPlanLimits(grower);
  return (
    limits.maxActiveListings === null ||
    currentListingCount + requestedCount <= limits.maxActiveListings
  );
}

/** Public plan descriptions cover the features actually available in this app. */
export const PLAN_PRESENTATION = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    priceDetail: '/month',
    description: 'List products and manage orders.',
    features: [
      'Up to 50 listings',
      'Orders, messages and delivered-value reports',
      'Import up to 25 rows at a time',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$249',
    priceDetail: '/month',
    description: 'For larger catalogs.',
    features: [
      'Unlimited listings',
      'Orders, messages and delivered-value reports',
      'Larger spreadsheet imports',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 'Custom',
    priceDetail: '',
    description: 'Discuss your team’s requirements.',
    features: [
      'Unlimited listings',
      'Orders, messages and delivered-value reports',
      'Larger spreadsheet imports',
    ],
  },
] as const;
