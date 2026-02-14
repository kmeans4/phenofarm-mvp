'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import Link from 'next/link';

interface StripeStatus {
  connected: boolean;
  stripeAccountId?: string;
  detailsSubmitted?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  businessName?: string;
  status?: string;
}

export function StripeConnect() {
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkStripeStatus();
  }, []);

  const checkStripeStatus = async () => {
    try {
      const res = await fetch('/api/stripe/account');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        // Account not connected yet
        setStatus({ connected: false });
      }
    } catch (err) {
      console.error('Failed to check Stripe status:', err);
      setError('Failed to load Stripe status');
    } finally {
      setLoading(false);
    }
  };

  const connectWithStripe = async () => {
    setConnecting(true);
    setError(null);

    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' });
      
      if (res.ok) {
        const data = await res.json();
        // Redirect to Stripe onboarding
        window.location.href = data.url;
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to connect with Stripe');
      }
    } catch (err) {
      console.error('Failed to connect:', err);
      setError('Connection failed. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          Loading Stripe status...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-600 mb-4">
            {error}
          </div>
          <Button onClick={checkStripeStatus} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Not connected - show connect button
  if (!status?.connected) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle>Stripe Connect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-gray-700">
            <p className="mb-2">
              Connect your Stripe account to receive payments from dispensaries.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Automatic payouts on weekly schedule</li>
              <li>✓ Secure payment processing</li>
              <li>✓ Instant verification</li>
            </ul>
          </div>
          <Button 
            onClick={connectWithStripe}
            disabled={connecting}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {connecting ? 'Connecting...' : 'Connect with Stripe'}
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2">
            You will be redirected to Stripe to complete onboarding
          </p>
        </CardContent>
      </Card>
    );
  }

  // Connected - show status dashboard
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-500"></span>
          Stripe Connect Active
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg ${status.chargesEnabled ? 'bg-green-50' : 'bg-yellow-50'}`}>
            <div className="text-sm text-gray-600 mb-1">Charges</div>
            <div className={`text-lg font-semibold ${status.chargesEnabled ? 'text-green-600' : 'text-yellow-600'}`}>
              {status.chargesEnabled ? 'Enabled' : 'Pending'}
            </div>
          </div>
          <div className={`p-4 rounded-lg ${status.payoutsEnabled ? 'bg-green-50' : 'bg-yellow-50'}`}>
            <div className="text-sm text-gray-600 mb-1">Payouts</div>
            <div className={`text-lg font-semibold ${status.payoutsEnabled ? 'text-green-600' : 'text-yellow-600'}`}>
              {status.payoutsEnabled ? 'Enabled' : 'Pending'}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-blue-50">
            <div className="text-sm text-gray-600 mb-1">Status</div>
            <div className="text-lg font-semibold text-blue-600">
              {status.status === 'active' ? 'Fully Active' : 'Onboarding'}
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Account Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Business Name</span>
              <span className="font-medium">{status.businessName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account ID</span>
              <span className="font-mono text-xs">{status.stripeAccountId?.substring(0, 24)}...</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            asChild 
            className="flex-1"
          >
            <Link href="https://dashboard.stripe.com" target="_blank">
              View Stripe Dashboard
            </Link>
          </Button>
          <Button 
            onClick={checkStripeStatus}
            variant="outline"
            className="flex-1"
          >
            Refresh Status
          </Button>
        </div>

        {status.chargesEnabled && status.payoutsEnabled && (
          <div className="bg-green-100 text-green-800 p-4 rounded-lg text-sm">
            <strong>✓ Your account is fully active!</strong> You&apos;re now receiving payments from dispensaries.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
