'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Badge } from '@/app/components/ui/Badge';
import { Button } from '@/app/components/ui/Button';
import { Card, CardContent } from '@/app/components/ui/Card';

type PlanId = 'free' | 'pro' | 'business';

interface SubscriptionData {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  checkoutConfigured: boolean;
  proCheckoutConfigured: boolean;
  businessCheckoutConfigured: boolean;
  portalAvailable: boolean;
}

interface PlanConfig {
  id: PlanId;
  name: string;
  price: string;
  priceDetail: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

const PLAN_CONFIGS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    priceDetail: '/mo',
    description: 'Start listing and managing requests.',
    features: [
      'Catalog and request management',
      'Up to 50 product listings',
      'Standard support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$249',
    priceDetail: '/mo ($199/mo billed annually)',
    description: 'For active wholesale teams.',
    features: [
      'Everything in Free',
      'Unlimited product listings',
      'Higher usage limits',
      'CSV bulk upload',
      'Priority support',
    ],
    highlighted: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 'Custom',
    priceDetail: '',
    description: 'For multi-license operations.',
    features: [
      'Everything in Pro',
      'API access',
      'Custom branding',
      'Dedicated onboarding',
    ],
  },
];

const PLAN_RANK: Record<PlanId, number> = {
  free: 0,
  pro: 1,
  business: 2,
};

function defaultSubscription(): SubscriptionData {
  return {
    plan: 'free',
    status: 'inactive',
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    checkoutConfigured: false,
    proCheckoutConfigured: false,
    businessCheckoutConfigured: false,
    portalAvailable: false,
  };
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getPlanName(plan: string) {
  return PLAN_CONFIGS.find((item) => item.id === plan)?.name || 'Free';
}

function getNormalizedPlan(plan: string): PlanId {
  return PLAN_CONFIGS.some((item) => item.id === plan) ? (plan as PlanId) : 'free';
}

function isPlanConfigured(subscription: SubscriptionData, plan: PlanId) {
  if (plan === 'free') return true;
  if (plan === 'pro') return subscription.proCheckoutConfigured;
  return subscription.businessCheckoutConfigured;
}

export function PricingPlans() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<PlanId | 'portal' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchSubscription = async () => {
      try {
        const response = await fetch('/api/grower/subscription');
        const data = await response.json().catch(() => ({}));
        if (!active) return;

        setSubscription(response.ok ? data : defaultSubscription());
      } catch {
        if (active) setSubscription(defaultSubscription());
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchSubscription();

    return () => {
      active = false;
    };
  }, []);

  const startCheckout = async (plan: Exclude<PlanId, 'free'>) => {
    setActionLoading(plan);
    setActionError(null);

    try {
      const response = await fetch('/api/grower/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Could not start subscription checkout');
      }

      window.location.href = data.url;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not start subscription checkout');
      setActionLoading(null);
    }
  };

  const openPortal = async () => {
    setActionLoading('portal');
    setActionError(null);

    try {
      const response = await fetch('/api/grower/subscription/portal', { method: 'POST' });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Could not open subscription portal');
      }

      window.location.href = data.url;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not open subscription portal');
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-pf-muted">
          Loading subscription plans...
        </CardContent>
      </Card>
    );
  }

  const currentSubscription = subscription || defaultSubscription();
  const currentPlan = getNormalizedPlan((currentSubscription.plan || 'free').toLowerCase());
  const currentPlanName = getPlanName(currentPlan);
  const renewalDate = formatDate(currentSubscription.currentPeriodEnd);
  const billingConfigured = currentSubscription.checkoutConfigured;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div><span className="text-pf-muted">Current plan: </span><strong>{currentPlanName}</strong>
          {renewalDate && <p className="mt-1 text-xs text-pf-muted">{currentSubscription.cancelAtPeriodEnd ? 'Cancels' : 'Renews'} {renewalDate}</p>}
        </div>
        {currentSubscription.portalAvailable && <Button type="button" variant="outline" onClick={openPortal} disabled={actionLoading !== null}>{actionLoading === 'portal' ? 'Opening billing...' : 'Manage billing'}</Button>}
      </div>
      {actionError && <p role="alert" className="rounded-lg bg-pf-danger-bg p-3 text-sm text-pf-danger">{actionError}</p>}
      {!billingConfigured && <p className="text-sm text-pf-muted">Paid upgrades are unavailable. <a className="text-pf-accent underline" href="/contact">Contact support</a>.</p>}

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
        {PLAN_CONFIGS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isIncludedInCurrentPlan = PLAN_RANK[plan.id] < PLAN_RANK[currentPlan];
          const canCheckout = billingConfigured && plan.id !== 'free' && isPlanConfigured(currentSubscription, plan.id);
          const planLoading = actionLoading === plan.id;

          return (
            <section
              key={plan.id}
              className={`relative flex rounded-lg border bg-pf-surface p-4 sm:p-6 shadow-sm ${
                plan.highlighted ? 'border-pf-accent-line ring-1 ring-pf-accent-line' : 'border-pf-line'
              }`}
            >
              <div className="flex min-h-full w-full flex-col">
                {plan.highlighted ? (
                  <span className="absolute -top-3 left-6 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-[#032116]">
                    Most popular
                  </span>
                ) : null}

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-pf-text">{plan.name}</h2>
                      {isCurrent ? <Badge variant="success">Current plan</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm text-pf-muted">{plan.description}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-2xl sm:text-3xl font-bold text-pf-text">{plan.price}</p>
                  {plan.priceDetail ? <p className="mt-1 text-sm text-pf-muted">{plan.priceDetail}</p> : null}
                </div>

                <details className="mt-3 flex-1 text-sm text-pf-secondary">
                  <summary className="min-h-10 cursor-pointer py-2 font-medium">Plan features</summary>
                  <ul className="mt-2 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-pf-accent" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  </ul>
                </details>

                <div className={isCurrent ? undefined : "mt-3 sm:mt-4"}>
                  {isCurrent ? (
                    <span className="sr-only">Selected subscription plan</span>
                  ) : isIncludedInCurrentPlan ? (
                    <Button type="button" variant="secondary" disabled className="w-full">
                      Included in current plan
                    </Button>
                  ) : plan.id === 'business' ? (
                    <Button type="button" variant="outline" className="w-full" asChild>
                      <a href="mailto:support@phenofarm.com?subject=PhenoFarm%20Business%20plan">Contact sales</a>
                    </Button>
                  ) : !billingConfigured ? (
                    <p className="rounded-lg bg-pf-canvas px-3 py-2 text-center text-sm text-pf-muted">
                      Checkout unavailable
                    </p>
                  ) : plan.id === 'free' ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={openPortal}
                      disabled={!currentSubscription.portalAvailable || actionLoading !== null}
                      title={currentSubscription.portalAvailable ? 'Open Stripe customer portal' : 'Manage plan changes after checkout'}
                    >
                      Manage billing
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      className="w-full"
                      onClick={() => startCheckout('pro')}
                      disabled={!canCheckout || actionLoading !== null}
                      title={canCheckout ? 'Start Stripe subscription checkout' : 'Paid upgrades are currently unavailable'}
                    >
                      {planLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          Starting checkout...
                        </span>
                      ) : 'Upgrade to Pro'}
                    </Button>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
