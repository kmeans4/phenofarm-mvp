import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { redirect } from "next/navigation";
import { CheckCircle2, CircleAlert, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface StatusItem {
  label: string;
  value: string;
  status: "ready" | "attention" | "info";
  helper: string;
}

const supportProfile = [
  { label: "Platform", value: "PhenoFarm" },
  { label: "Support email", value: "support@phenofarm.com" },
  { label: "Wholesale settlement", value: "Handled directly between buyer and grower" },
  { label: "In-app payment flow", value: "Cultivator subscriptions paid to PhenoFarm" },
];

function envStatus(key: string, label: string, helper: string): StatusItem {
  const configured = Boolean(process.env[key]);
  return {
    label,
    value: configured ? "Configured" : "Needs provider setup",
    status: configured ? "ready" : "attention",
    helper,
  };
}

function StatusBadge({ status }: { status: StatusItem["status"] }) {
  if (status === "ready") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Ready
      </span>
    );
  }

  if (status === "attention") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
        <CircleAlert className="h-3.5 w-3.5" />
        Review
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
      <ShieldCheck className="h-3.5 w-3.5" />
      Policy
    </span>
  );
}

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/sign_in");
  }

  if (session.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const subscriptionConfig: StatusItem[] = [
    envStatus("STRIPE_SECRET_KEY", "Stripe secret key", "Required to start cultivator subscription Checkout."),
    envStatus("STRIPE_WEBHOOK_SECRET", "Stripe webhook secret", "Required to keep subscription status synced after checkout and portal updates."),
    envStatus("STRIPE_PRO_PRICE_ID", "Pro price ID", "Enables the Pro cultivator plan button in grower settings."),
    envStatus("STRIPE_BUSINESS_PRICE_ID", "Business price ID", "Enables the Business cultivator plan button in grower settings."),
    {
      label: "Wholesale payments",
      value: "Not processed in PhenoFarm",
      status: "info",
      helper: "Order values are operational records only; buyer-seller settlement stays outside the app.",
    },
  ];

  const operationalPolicies: StatusItem[] = [
    {
      label: "License review",
      value: "Admin-controlled",
      status: "info",
      helper: "Use the grower and dispensary review queues to verify license status before marketplace access.",
    },
    {
      label: "Notification templates",
      value: "Code-managed",
      status: "info",
      helper: "Transactional message copy should be changed in code until a durable settings store exists.",
    },
    {
      label: "Demo accounts",
      value: "Enabled by request",
      status: "attention",
      helper: "Demo access is intentionally retained for now. Review before any public production launch.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Read-only operations view for billing, policy, and support configuration. Changes are made in provider
          settings or code so admins are not shown controls that silently fail.
        </p>
      </div>

      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-950">
        <p className="font-semibold">PhenoFarm subscription revenue only</p>
        <p className="mt-1">
          Cultivators pay PhenoFarm for software subscriptions. Wholesale order payment and settlement are coordinated
          directly between businesses outside the app.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Support Profile</h2>
            <p className="mt-1 text-sm text-gray-500">Displayed policy and support facts for operators.</p>
          </div>
          <dl className="divide-y divide-gray-100">
            {supportProfile.map((item) => (
              <div key={item.label} className="grid gap-1 px-6 py-4 sm:grid-cols-[180px_1fr]">
                <dt className="text-sm font-medium text-gray-500">{item.label}</dt>
                <dd className="text-sm font-semibold text-gray-900">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Cultivator Billing Configuration</h2>
            <p className="mt-1 text-sm text-gray-500">Provider readiness for Stripe Billing subscriptions.</p>
          </div>
          <div className="divide-y divide-gray-100">
            {subscriptionConfig.map((item) => (
              <div key={item.label} className="px-6 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                    <p className="mt-1 text-sm text-gray-600">{item.value}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-2 text-xs text-gray-500">{item.helper}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Operational Policies</h2>
            <p className="mt-1 text-sm text-gray-500">Current admin rules that affect launch readiness.</p>
          </div>
          <div className="grid gap-4 p-6 md:grid-cols-3">
            {operationalPolicies.map((item) => (
              <div key={item.label} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                    <p className="mt-1 text-sm text-gray-600">{item.value}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-3 text-xs leading-5 text-gray-500">{item.helper}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">Need to update subscription prices?</p>
          <p className="mt-1 text-sm text-gray-600">
            Update Stripe price IDs in the deployment environment, then redeploy before testing checkout.
          </p>
        </div>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
        >
          Admin dashboard
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
