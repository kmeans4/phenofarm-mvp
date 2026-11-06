'use client';
import Link from 'next/link';
import { PLAN_PRESENTATION } from '@/lib/plans';
import { Button } from '@/app/components/ui/Button';
import { SubscriptionBilling } from '@/app/components/settings/SubscriptionBilling';
export function PricingPlans() {
  return (
    <div className="space-y-5">
      <SubscriptionBilling />
      <div className="grid gap-4 lg:grid-cols-2">
        {PLAN_PRESENTATION.map((plan) => (
          <section
            key={plan.id}
            className="min-w-0 rounded-xl border border-pf-line bg-pf-surface p-5"
          >
            <h2 className="text-lg font-semibold">{plan.name}</h2>
            <p className="mt-2 text-3xl font-bold">{plan.price}</p>
            <p className="text-sm text-pf-muted">{plan.priceDetail}</p>
            <p className="my-4">{plan.description}</p>
            <ul className="space-y-2 text-sm text-pf-secondary">
              {plan.features.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="text-sm text-pf-muted">
        Online subscriptions are not available yet. You can prepare your catalog
        now. Wholesale payments are arranged directly between growers and
        buyers.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/grower/products">Manage products</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/contact">Contact support</Link>
        </Button>
      </div>
    </div>
  );
}
