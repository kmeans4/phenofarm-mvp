import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from 'next/link';
import { SeedDataButton } from "../components/SeedDataButton";
import { SetupChecklist } from "@/app/components/ux/SetupChecklist";
import { GuidedFixPanel } from "@/app/components/ux/GuidedFixPanel";
import { RolePrimaryAction } from "@/app/components/ux/RolePrimaryAction";

export default async function AdminPage() {
  let session;
  
  try {
    session = await getServerSession(authOptions);
  } catch {
    redirect('/auth/sign_in');
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session || !session?.user) {
    redirect('/auth/sign_in');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = session.user.role as string;
  
  if (userRole !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Fetch stats
  let stats = { users: 0, growers: 0, dispensaries: 0, growersToReview: 0, dispensariesToReview: 0, verifiedGrowers: 0 };
  try {
    const [users, growers, dispensaries, growersToReview, dispensariesToReview, verifiedGrowers] = await Promise.all([
      db.user.count(),
      db.grower.count(),
      db.dispensary.count(),
      db.grower.count({ where: { isVerified: false } }),
      db.dispensary.count({ where: { isVerified: false } }),
      db.grower.count({ where: { isVerified: true } }),
    ]);
    stats = { users, growers, dispensaries, growersToReview, dispensariesToReview, verifiedGrowers };
  } catch {
    // Keep default stats on error
  }

  const needsSeeding = stats.growers === 0 && stats.dispensaries === 0;
  const subscriptionConfigured = Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    (process.env.STRIPE_PRO_PRICE_ID || process.env.STRIPE_BUSINESS_PRICE_ID)
  );
  const adminChecklist = [
    {
      label: 'Cultivator review',
      description: stats.growersToReview === 0 ? 'All cultivators are reviewed.' : `${stats.growersToReview} cultivator accounts need review.`,
      href: '/admin/growers',
      complete: stats.growersToReview === 0,
      cta: 'Review cultivators',
    },
    {
      label: 'Dispensary review',
      description: stats.dispensariesToReview === 0 ? 'All dispensaries are reviewed.' : `${stats.dispensariesToReview} dispensary accounts need review.`,
      href: '/admin/dispensaries',
      complete: stats.dispensariesToReview === 0,
      cta: 'Review buyers',
    },
    {
      label: 'Subscription configuration',
      description: subscriptionConfigured
        ? 'Stripe Billing keys and at least one price ID are configured.'
        : 'Confirm Stripe Billing price IDs and support details before enabling paid plans.',
      href: '/admin/settings',
      complete: subscriptionConfigured,
      cta: 'Open settings',
    },
    {
      label: 'Marketplace activity',
      description: stats.growers > 0 && stats.dispensaries > 0 ? 'Marketplace has both seller and buyer accounts.' : 'Seed or invite both sides of the marketplace.',
      href: needsSeeding ? '/admin/dashboard' : '/admin/users',
      complete: stats.growers > 0 && stats.dispensaries > 0,
      cta: 'Review users',
    },
  ];
  const exceptionItems = [
    stats.growersToReview > 0
      ? {
          title: `${stats.growersToReview} cultivator verification exception${stats.growersToReview === 1 ? '' : 's'}`,
          description: 'Review license, subscription readiness, and marketplace access.',
          href: '/admin/growers',
          cta: 'Review cultivators',
          severity: 'critical' as const,
        }
      : null,
    stats.dispensariesToReview > 0
      ? {
          title: `${stats.dispensariesToReview} dispensary verification exception${stats.dispensariesToReview === 1 ? '' : 's'}`,
          description: 'Confirm retail license details before enabling buyer workflows.',
          href: '/admin/dispensaries',
          cta: 'Review dispensaries',
          severity: 'warning' as const,
        }
      : null,
    {
      title: 'Subscription configuration check',
      description: 'Confirm cultivator subscription settings and support copy before wider rollout.',
      href: '/admin/settings',
      cta: 'Open settings',
      severity: 'info' as const,
    },
  ].filter((item): item is { title: string; description: string; href: string; cta: string; severity: 'critical' | 'warning' | 'info' } => item !== null);
  const primaryAction = stats.growersToReview > 0
    ? {
        title: 'Review cultivator verification queue',
        description: 'Cultivator access and subscription readiness are the highest-impact admin checks.',
        href: '/admin/growers',
        cta: 'Review cultivators',
        secondaryHref: '/admin/settings',
        secondaryCta: 'Subscription settings',
      }
    : stats.dispensariesToReview > 0
      ? {
          title: 'Review dispensary verification queue',
          description: 'Clear buyer verification issues before they submit requests.',
          href: '/admin/dispensaries',
          cta: 'Review dispensaries',
          secondaryHref: '/admin/growers',
          secondaryCta: 'Cultivators',
        }
      : {
          title: 'Review subscription settings',
          description: 'Keep PhenoFarm subscription configuration current for cultivator billing.',
          href: '/admin/settings',
          cta: 'Open settings',
        };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage subscriptions, verification, and marketplace operations</p>
      </div>

      <RolePrimaryAction {...primaryAction} />

      {needsSeeding && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 mb-2">No growers or dispensaries found in the database.</p>
          <SeedDataButton />
        </div>
      )}

      <SetupChecklist title="Keep operations ready" items={adminChecklist} />

      <GuidedFixPanel
        title="Admin exception queue"
        description="Work through verification and subscription setup exceptions before they become support tickets."
        fixes={exceptionItems}
      />

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Priority work</p>
        <h2 className="mt-1 text-lg font-semibold text-gray-900">Subscription and compliance queue</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Link href="/admin/growers" className="rounded-lg border border-green-200 bg-green-50 p-3 text-green-950 hover:bg-green-100">
            <p className="text-sm font-semibold">{stats.growersToReview} cultivators to review</p>
            <p className="mt-1 text-sm text-green-800">Verify license, subscription readiness, and marketplace access.</p>
          </Link>
          <Link href="/admin/dispensaries" className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-950 hover:bg-blue-100">
            <p className="text-sm font-semibold">{stats.dispensariesToReview} dispensaries to review</p>
            <p className="mt-1 text-sm text-blue-800">Review buyer license and retail account status.</p>
          </Link>
          <Link href="/admin/settings" className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-950 hover:bg-gray-100">
            <p className="text-sm font-semibold">Subscription settings</p>
            <p className="mt-1 text-sm text-gray-700">Confirm Stripe Billing price IDs, notifications, and support details.</p>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Business model</p>
        <h2 className="mt-1 text-lg font-semibold text-blue-950">PhenoFarm subscription revenue only</h2>
        <p className="mt-1 text-sm text-blue-900">
          Cultivators pay PhenoFarm subscription fees. Wholesale order value is tracked for marketplace operations,
          but buyer-seller settlement happens directly outside the app.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.users}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Cultivators</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.growers}</p>
              <p className="mt-1 text-xs text-gray-500">{stats.verifiedGrowers} verified for marketplace access</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Dispensaries</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.dispensaries}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
