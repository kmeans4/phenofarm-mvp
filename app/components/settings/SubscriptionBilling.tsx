'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';

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

export function SubscriptionBilling() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/grower/subscription');
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      } else {
        // No subscription yet - show default
        setSubscription({
          plan: 'free',
          status: 'inactive',
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          checkoutConfigured: false,
          proCheckoutConfigured: false,
          businessCheckoutConfigured: false,
          portalAvailable: false,
        });
      }
    } catch (err) {
      console.error('Failed to load subscription:', err);
      setSubscription({
        plan: 'free',
        status: 'inactive',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        checkoutConfigured: false,
        proCheckoutConfigured: false,
        businessCheckoutConfigured: false,
        portalAvailable: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const startCheckout = async (plan: 'pro' | 'business') => {
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

      window.location.href = data.url;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not start subscription checkout');
      setActionLoading(null);
    }
  };

  const openPortal = async () => {
    setActionLoading('portal');
    setActionError(null);

    try {
      const res = await fetch('/api/grower/subscription/portal', { method: 'POST' });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Could not open subscription portal');
      }

      window.location.href = data.url;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not open subscription portal');
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
        return <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">PRO</span>;
      case 'business':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">BUSINESS</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">FREE</span>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          Loading subscription details...
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return null;
  }

  return (
    <Card className="border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Cultivator Subscription</span>
          {getPlanBadge(subscription?.plan || 'free')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-950">
          <p className="font-medium">This is the only payment flow in PhenoFarm.</p>
          <p className="mt-1">
            Growers pay PhenoFarm a software subscription. Wholesale order payments are handled directly between
            buyers and sellers outside the app.
          </p>
        </div>

        {actionError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {/* Current Plan */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-medium text-gray-900">
                {subscription?.plan === 'pro' ? 'Pro Plan' : 
                 subscription?.plan === 'business' ? 'Business Plan' : 'Free Plan'}
              </h4>
              <p className="text-sm text-gray-500">
                {subscription?.plan === 'free' 
                  ? subscription.checkoutConfigured
                    ? 'Starter access'
                    : 'Starter access while Stripe price IDs are configured'
                  : subscription?.status === 'active' ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {subscription?.plan === 'free' ? '$0' : 
                 subscription?.plan === 'pro' ? '$49' : '$149'}
                <span className="text-sm font-normal text-gray-500">/mo</span>
              </p>
            </div>
          </div>
          
          {subscription?.currentPeriodEnd && (
            <p className="text-xs text-gray-500 mt-2">
              {subscription.cancelAtPeriodEnd 
                ? `Cancels on ${formatDate(subscription.currentPeriodEnd)}`
                : `Renews on ${formatDate(subscription.currentPeriodEnd)}`}
            </p>
          )}
        </div>

        {/* Plan Features */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Plan Features</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center ${subscription?.plan !== 'free' ? 'bg-green-500' : 'bg-gray-300'}`}>
                {subscription?.plan !== 'free' && <span className="text-white text-xs">✓</span>}
              </span>
              <span className={subscription?.plan !== 'free' ? 'text-gray-700' : 'text-gray-400'}>Expanded catalog listings</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center ${subscription?.plan !== 'free' ? 'bg-green-500' : 'bg-gray-300'}`}>
                {subscription?.plan !== 'free' && <span className="text-white text-xs">✓</span>}
              </span>
              <span className={subscription?.plan !== 'free' ? 'text-gray-700' : 'text-gray-400'}>Priority grower support</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </span>
              <span className="text-gray-700">Estimated request value reports</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center ${subscription?.plan === 'business' ? 'bg-green-500' : 'bg-gray-300'}`}>
                {subscription?.plan === 'business' && <span className="text-white text-xs">✓</span>}
              </span>
              <span className={subscription?.plan === 'business' ? 'text-gray-700' : 'text-gray-400'}>Advanced integrations</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t pt-4">
          {subscription?.plan === 'free' ? (
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={!subscription.proCheckoutConfigured || actionLoading !== null}
              title={subscription.proCheckoutConfigured ? 'Start Stripe subscription checkout' : 'Add STRIPE_PRO_PRICE_ID to enable checkout'}
              onClick={() => startCheckout('pro')}
            >
              {actionLoading === 'pro' ? 'Starting Checkout...' : 'Upgrade Cultivator Plan'}
            </Button>
          ) : subscription?.plan === 'pro' ? (
            <>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                disabled={!subscription.businessCheckoutConfigured || actionLoading !== null}
                title={subscription.businessCheckoutConfigured ? 'Start Stripe subscription checkout' : 'Add STRIPE_BUSINESS_PRICE_ID to enable checkout'}
                onClick={() => startCheckout('business')}
              >
                {actionLoading === 'business' ? 'Starting Checkout...' : 'Switch to Business'}
              </Button>
              <Button
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
                disabled={!subscription.portalAvailable || actionLoading !== null}
                title={subscription.portalAvailable ? 'Open Stripe customer portal' : 'Customer portal is available after checkout'}
                onClick={openPortal}
              >
                Manage
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
              disabled={!subscription.portalAvailable || actionLoading !== null}
              title={subscription.portalAvailable ? 'Open Stripe customer portal' : 'Customer portal is available after checkout'}
              onClick={openPortal}
            >
              {actionLoading === 'portal' ? 'Opening Portal...' : 'Manage Subscription'}
            </Button>
          )}
        </div>

        {/* Billing History Link */}
        <div className="text-center">
          <Button
            variant="link"
            className="text-sm text-gray-500"
            disabled={!subscription?.portalAvailable || actionLoading !== null}
            title={subscription?.portalAvailable ? 'Open Stripe customer portal' : 'Customer portal is available after checkout'}
            onClick={openPortal}
          >
            Manage Subscription
          </Button>
        </div>

        {!subscription.checkoutConfigured && (
          <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
            Add STRIPE_PRO_PRICE_ID or STRIPE_BUSINESS_PRICE_ID in the environment to enable Stripe Billing checkout.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
