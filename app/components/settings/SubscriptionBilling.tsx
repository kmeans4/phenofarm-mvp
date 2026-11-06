'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
export interface SubscriptionData {
  plan: string;
  status: string;
  visibility?: 'visible' | 'subscription' | 'verification';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  checkoutConfigured: boolean;
  proCheckoutConfigured: boolean;
  businessCheckoutConfigured: boolean;
  portalAvailable: boolean;
}
export function SubscriptionBilling({
  initialData,
}: {
  initialData?: SubscriptionData | null;
}) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const r = await fetch('/api/grower/subscription');
      if (!r.ok) throw new Error();
      setData(await r.json());
    } catch {
      setError('Could not load your subscription. Please try again.');
    }
  }, []);
  useEffect(() => {
    if (initialData) setData(initialData);
    else void load();
  }, [initialData, load]);
  const visible = data?.visibility === 'visible';
  return (
    <section
      className="rounded-xl border border-pf-line bg-pf-surface p-5"
      aria-label="Subscription and buyer visibility"
    >
      <h2 className="text-lg font-semibold">Subscription & buyer visibility</h2>
      {error ? (
        <div className="mt-3">
          <p role="alert">{error}</p>
          <Button onClick={() => void load()}>Retry</Button>
        </div>
      ) : !data ? (
        <p className="mt-3 text-pf-muted">Loading subscription…</p>
      ) : (
        <>
          <p className="mt-3 font-semibold text-pf-accent">
            {visible
              ? 'Your published, available products are visible to buyers'
              : data.visibility === 'verification'
                ? 'Your products are hidden — license verification needed'
                : 'Your products are hidden — activate a subscription to sell'}
          </p>
          <p className="mt-2 text-sm text-pf-muted">
            You can create listings, import products and manage stock for free.
            Buyer visibility requires an active subscription and an approved,
            current license.
          </p>
          {data.currentPeriodEnd && (
            <p className="mt-2 text-sm">
              Current access {data.cancelAtPeriodEnd ? 'ends' : 'through'}{' '}
              {new Date(data.currentPeriodEnd).toLocaleDateString('en-US', {
                timeZone: 'America/New_York',
              })}
              .
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link
                href={
                  data.visibility === 'verification'
                    ? '/grower/settings#license'
                    : '/contact'
                }
              >
                {data.visibility === 'verification'
                  ? 'Review license'
                  : 'Contact support'}
              </Link>
            </Button>
            <Button variant="ghost" onClick={() => void load()}>
              Refresh status
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
