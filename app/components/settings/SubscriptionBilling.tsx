'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';

interface SubscriptionData {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export function SubscriptionBilling() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        });
      }
    } catch (err) {
      console.error('Failed to load subscription:', err);
      setSubscription({
        plan: 'free',
        status: 'inactive',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      });
    } finally {
      setLoading(false);
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

  return (
    <Card className="border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Subscription & Billing</span>
          {getPlanBadge(subscription?.plan || 'free')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
                  ? 'Limited features' 
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
              <span className={subscription?.plan !== 'free' ? 'text-gray-700' : 'text-gray-400'}>Unlimited products</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center ${subscription?.plan !== 'free' ? 'bg-green-500' : 'bg-gray-300'}`}>
                {subscription?.plan !== 'free' && <span className="text-white text-xs">✓</span>}
              </span>
              <span className={subscription?.plan !== 'free' ? 'text-gray-700' : 'text-gray-400'}>Priority support</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </span>
              <span className="text-gray-700">Basic analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center ${subscription?.plan === 'business' ? 'bg-green-500' : 'bg-gray-300'}`}>
                {subscription?.plan === 'business' && <span className="text-white text-xs">✓</span>}
              </span>
              <span className={subscription?.plan === 'business' ? 'text-gray-700' : 'text-gray-400'}>API access</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t pt-4">
          {subscription?.plan === 'free' ? (
            <Button className="flex-1 bg-green-600 hover:bg-green-700">
              Upgrade Plan
            </Button>
          ) : subscription?.plan === 'pro' ? (
            <>
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
                Switch to Business
              </Button>
              <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="outline" className="flex-1 text-red-600 border-red-300 hover:bg-red-50">
              Cancel Subscription
            </Button>
          )}
        </div>

        {/* Billing History Link */}
        <div className="text-center">
          <Button variant="link" className="text-sm text-gray-500">
            View Billing History →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
