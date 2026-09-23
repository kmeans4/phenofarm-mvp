import { CheckCircle2, CircleAlert, ShieldCheck } from "lucide-react";
import { CopyToClipboardButton } from "@/app/admin/components/CopyToClipboardButton";
import { PageHeader } from "@/app/components/ui/PageHeader";

interface StatusItem {
  label: string;
  value: string;
  status: "ready" | "attention" | "info";
  helper: string;
}

const supportProfile = [
  { label: "Support email", value: "support@phenofarm.com" },
];

const supportEmail = "support@phenofarm.com";
const providerSetupLocation = "Configure in Vercel Project Settings > Environment Variables, then redeploy.";

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
      <span className="inline-flex w-fit shrink-0 self-start items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Configured
      </span>
    );
  }

  if (status === "attention") {
    return (
      <span className="inline-flex w-fit shrink-0 self-start items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
        <CircleAlert className="h-3.5 w-3.5" />
        Needs setup
      </span>
    );
  }

  return (
    <span className="inline-flex w-fit shrink-0 self-start items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
      <ShieldCheck className="h-3.5 w-3.5" />
      Policy
    </span>
  );
}

export default async function AdminSettingsPage() {
  const subscriptionConfig: StatusItem[] = [
    envStatus("STRIPE_SECRET_KEY", "Stripe secret key", "Required to start grower subscription checkout."),
    envStatus("STRIPE_WEBHOOK_SECRET", "Stripe webhook secret", "Required to keep subscription status synced after checkout and portal updates."),
    envStatus("STRIPE_PRO_PRICE_ID", "Pro price ID", "Enables the Pro plan in grower settings."),
    envStatus("STRIPE_BUSINESS_PRICE_ID", "Business price ID", "Enables the Business plan in grower settings."),
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
      helper: "Transactional templates are managed by the product team.",
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
      <PageHeader
          compact
        title="Settings"
        description="View billing, support, and policies."
      />

      <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-950">
        <p className="font-semibold">Settlement policy</p>
        <p className="mt-1">
          PhenoFarm bills only grower subscriptions. Wholesale payment stays between licensed businesses.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Grower billing</h2>
            <p className="mt-1 text-sm text-gray-500">Stripe subscription readiness.</p>
          </div>
          <div className="border-b border-gray-100 bg-amber-50 px-6 py-3 text-xs text-amber-900">
            {subscriptionConfig.some((item) => item.status === "attention") ? providerSetupLocation : "Stripe settings are ready for testing."}
          </div>
          <div className="divide-y divide-gray-100">
            {subscriptionConfig.filter(item => item.status === 'attention').map(item => (
              <div key={item.label} className="px-4 py-3 sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-1 text-xs text-gray-500">{item.helper}</p>
              </div>
            ))}
          </div>
          {subscriptionConfig.some(item => item.status === 'ready') && <details className="border-t border-gray-100 px-4 py-3 sm:px-6">
            <summary className="cursor-pointer text-sm font-medium text-gray-700">{subscriptionConfig.filter(item => item.status === 'ready').length} configured</summary>
            <div className="mt-3 space-y-3">
              {subscriptionConfig.filter(item => item.status === 'ready').map(item => (
                <div key={item.label} className="flex items-start justify-between gap-3"><span className="text-sm text-gray-700">{item.label}</span><StatusBadge status={item.status} /></div>
              ))}
            </div>
          </details>}

        </section>

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Support</h2>
          </div>
          <dl className="divide-y divide-gray-100">
            {supportProfile.map((item) => (
              <div key={item.label} className="grid gap-1 px-6 py-4 sm:grid-cols-[180px_1fr]">
                <dt className="text-sm font-medium text-gray-500">{item.label}</dt>
                <dd className="text-sm font-semibold text-gray-900">
                  {item.value === supportEmail ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`mailto:${supportEmail}`}
                        className="text-green-700 hover:text-green-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                      >
                        {supportEmail}
                      </a>
                      <CopyToClipboardButton value={supportEmail} label="Copy support email" />
                    </div>
                  ) : item.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Policies</h2>
          </div>
          <dl className="divide-y divide-gray-100">
            {operationalPolicies.map(item => (
              <div key={item.label} className="px-4 py-3 sm:px-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2"><dt className="text-sm font-semibold text-gray-900">{item.label}</dt><dd className="text-sm text-gray-600">{item.value}</dd></div>
                <details className="mt-1 text-xs text-gray-500"><summary className="cursor-pointer">Details</summary><p className="mt-2 leading-5">{item.helper}</p></details>
              </div>
            ))}
          </dl>
        </section>
      </div>

    </div>
  );
}
