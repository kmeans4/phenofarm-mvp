'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';

export interface SubscriptionData {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  checkoutConfigured: boolean;
  proCheckoutConfigured: boolean;
  businessCheckoutConfigured: boolean;
  portalAvailable: boolean;
}

export function SubscriptionBilling({ initialData }: { initialData?: SubscriptionData | null }) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(initialData || null);
  const [loading, setLoading] = useState(initialData === undefined);
  const [loadError, setLoadError] = useState(initialData === null ? 'Subscription details could not be loaded.' : '');
  const pendingRef = useRef(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => { if (initialData === undefined) void fetchSubscription(); }, [initialData]);

  const fetchSubscription = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/grower/subscription');
      if (!res.ok) throw new Error('Subscription details could not be loaded. Your plan has not changed.');
      const data = await res.json();
      if (!data || typeof data.plan !== 'string' || typeof data.status !== 'string') throw new Error('Invalid subscription response.');
      setSubscription(data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Subscription details could not be loaded.');
    } finally { setLoading(false); }
  };

  const navigateToStripe = (value: unknown) => {
    if (typeof value !== 'string') throw new Error('Billing returned an invalid link.');
    const url = new URL(value);
    if (url.protocol !== 'https:' || !['checkout.stripe.com', 'billing.stripe.com'].includes(url.hostname) || url.username || url.password) throw new Error('Billing returned an invalid link.');
    window.location.assign(url.href);
  };

  const startCheckout = async (plan: 'pro' | 'business') => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setActionLoading(plan);
    setActionError(null);

    try {
      const res = await fetch('/api/grower/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Could not start subscription checkout');
      }

      navigateToStripe(data.url);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not start subscription checkout');
      pendingRef.current = false;
      setActionLoading(null);
    }
  };

  const openPortal = async () => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setActionLoading('portal');
    setActionError(null);

    try {
      const res = await fetch('/api/grower/subscription/portal', { method: 'POST' });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Could not open subscription portal');
      }

      navigateToStripe(data.url);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not open subscription portal');
      pendingRef.current = false;
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'pro':
        return <span className="px-2 py-1 bg-pf-purple-bg text-pf-purple text-xs font-medium rounded-full">PRO</span>;
      case 'business':
        return <span className="px-2 py-1 bg-pf-warning-bg text-pf-warning text-xs font-medium rounded-full">BUSINESS</span>;
      default:
        return <span className="px-2 py-1 bg-pf-surface text-pf-secondary text-xs font-medium rounded-full">FREE</span>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-pf-muted">
          Loading subscription details...
        </CardContent>
      </Card>
    );
  }

  if (loadError || !subscription) {
    return <Card><CardContent className="space-y-3 p-6"><p role="alert" className="text-sm text-pf-danger">{loadError || 'Subscription details are unavailable.'}</p><Button type="button" variant="outline" onClick={() => void fetchSubscription()}>Retry</Button></CardContent></Card>;
  }

  const planFeatureRows = [
    { label: 'Expanded catalog listings', included: subscription.plan !== 'free' },
    { label: 'Priority grower support', included: subscription.plan !== 'free' },
    { label: 'Estimated request value reports', included: true },
    { label: 'Advanced integrations', included: subscription.plan === 'business' },
  ];

  return (
    <Card className="border-pf-accent-line">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Subscription</span>
          {getPlanBadge(subscription?.plan || 'free')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-pf-muted">Software subscription only. Wholesale payment stays directly between businesses.</p>

        {actionError && (
          <div className="rounded-lg border border-pf-danger-line bg-pf-danger-bg p-3 text-sm text-pf-danger">
            {actionError}
          </div>
        )}

        {/* Current Plan */}
        <div className="bg-pf-canvas rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-medium text-pf-text">
                {subscription?.plan === 'pro' ? 'Pro Plan' : 
                 subscription?.plan === 'business' ? 'Business Plan' : 'Free Plan'}
              </h4>
              <p className="text-sm text-pf-muted">
                {subscription?.plan === 'free' 
                  ? subscription.checkoutConfigured
                    ? 'Starter access'
                    : 'Starter access'
                  : subscription?.status === 'active' ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-pf-text">
                {subscription?.plan === 'free' ? '$0' :
                 subscription?.plan === 'pro' ? '$249' : 'Custom'}
                {subscription?.plan !== 'business' && <span className="text-sm font-normal text-pf-muted">/mo</span>}
              </p>
              {subscription?.plan === 'pro' && (
                <p className="text-xs text-pf-muted">$199/mo billed annually</p>
              )}
            </div>
          </div>
          
          {subscription?.currentPeriodEnd && (
            <p className="text-xs text-pf-muted mt-2">
              {subscription.cancelAtPeriodEnd 
                ? `Cancels on ${formatDate(subscription.currentPeriodEnd)}`
                : `Renews on ${formatDate(subscription.currentPeriodEnd)}`}
            </p>
          )}
        </div>

        {/* Plan Features */}
        <details className="border-t border-pf-line pt-3">
          <summary className="cursor-pointer py-2 text-sm font-medium text-pf-secondary">Plan features</summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {planFeatureRows.map((feature) => (
              <div key={feature.label} className="flex items-center gap-2">
                <span
                  aria-label={feature.included ? 'Included' : 'Not included'}
                  className={`flex h-5 w-5 flex-none items-center justify-center rounded-full ${
                    feature.included ? 'bg-pf-accent-bg text-pf-accent' : 'bg-pf-surface text-pf-muted'
                  }`}
                >
                  {feature.included ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </span>
                <span className={feature.included ? 'text-pf-secondary' : 'text-pf-muted'}>{feature.label}</span>
              </div>
            ))}
          </div>
        </details>

        <div className="flex flex-wrap gap-3 border-t border-pf-line pt-4">
          {subscription.plan === 'free' && !subscription.portalAvailable && (
            <Button disabled={!subscription.proCheckoutConfigured || actionLoading !== null} onClick={() => startCheckout('pro')}>
              {actionLoading === 'pro' ? 'Opening checkout...' : 'Upgrade to Pro'}
            </Button>
          )}
          {subscription.portalAvailable && (
            <Button variant="outline" disabled={actionLoading !== null} onClick={openPortal}>
              {actionLoading === 'portal' ? 'Opening billing...' : 'Manage Subscription'}
            </Button>
          )}
        </div>
        {!subscription.checkoutConfigured && <p className="text-sm text-pf-muted">Online subscription checkout is currently unavailable.</p>}
      </CardContent>
    </Card>
  );
}
