import { requireAdmin } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import Link from 'next/link';
import { StatCard } from '@/app/components/ui/StatCard';
import { Users, Sprout, Building2 } from 'lucide-react';
export default async function AdminPage() {
  await requireAdmin();
  const [users, growers, buyers, growerPending, buyerPending] =
    await Promise.all([
      db.user.count(),
      db.grower.count(),
      db.dispensary.count({ where: { isOffPlatform: false } }),
      db.grower.count({
        where: { isVerified: false, licenseStatus: 'pending_review' },
      }),
      db.dispensary.count({
        where: {
          isOffPlatform: false,
          isVerified: false,
          licenseStatus: 'pending_review',
        },
      }),
    ]);
  const pending = growerPending + buyerPending;
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Overview</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          title="Users"
          value={users}
          href="/admin/users"
          icon={<Users />}
        />
        <StatCard
          title="Growers"
          value={growers}
          href="/admin/growers?status=all"
          icon={<Sprout />}
        />
        <StatCard
          title="Dispensaries"
          value={buyers}
          href="/admin/dispensaries?status=all"
          icon={<Building2 />}
        />
      </div>
      <section className="rounded-xl border border-pf-line bg-pf-surface p-5">
        <h2 className="text-lg font-semibold">
          {pending
            ? `${pending} businesses need review`
            : 'Review queue is clear'}
        </h2>
        {pending > 0 && (
          <p className="mt-2 text-sm text-pf-muted">
            {growerPending} growers · {buyerPending} dispensaries
          </p>
        )}
        <Link
          className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-pf-canvas"
          href="/admin/review"
        >
          Open review queue
        </Link>
      </section>
    </div>
  );
}
