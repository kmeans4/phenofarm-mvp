import { requireAdmin } from '@/lib/auth-helpers';
import { accountMailConfigured } from '@/lib/account-mail';
import Link from 'next/link';
export default async function Settings() {
  await requireAdmin();
  const services = [
    { label: 'Account email', ready: accountMailConfigured() },
    {
      label: 'Subscription checkout',
      ready: Boolean(
        process.env.STRIPE_SECRET_KEY &&
          process.env.STRIPE_WEBHOOK_SECRET &&
          (process.env.STRIPE_PRO_PRICE_ID ||
            process.env.STRIPE_BUSINESS_PRICE_ID)
      ),
    },
  ];
  const needsAttention = services.some((s) => !s.ready);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">System settings</h1>
      <p
        className={`rounded-lg border p-3 text-sm ${needsAttention ? 'border-pf-warning-line bg-pf-warning-bg text-pf-warning' : 'border-pf-accent-line bg-pf-accent-bg text-pf-accent'}`}
      >
        {needsAttention
          ? 'Some services need setup. Contact the site administrator.'
          : 'All configured services are ready.'}
      </p>
      <dl className="divide-y divide-pf-line rounded-xl border border-pf-line bg-pf-surface px-4">
        {services.map((s) => (
          <div
            key={s.label}
            className="flex flex-wrap justify-between gap-2 py-4 text-sm"
          >
            <dt>{s.label}</dt>
            <dd className={s.ready ? 'text-pf-accent' : 'text-pf-warning'}>
              {s.ready ? 'Configured' : 'Needs setup'}
            </dd>
          </div>
        ))}
      </dl>
      <Link
        className="inline-flex min-h-11 items-center text-pf-accent underline"
        href="/contact"
      >
        Contact support
      </Link>
    </div>
  );
}
