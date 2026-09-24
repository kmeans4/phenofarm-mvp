import { CheckCircle2, ChevronDown, CircleAlert, ShieldCheck } from "lucide-react";
import { CopyToClipboardButton } from "@/app/admin/components/CopyToClipboardButton";
import { PageHeader } from "@/app/components/ui/PageHeader";

interface StatusItem {
  label: string;
  value: string;
  status: "ready" | "attention" | "info";
  helper: string;
}

const supportProfile = [
  { label: "Support email", value: "support@phenoshop.app" },
];

const supportEmail = "support@phenoshop.app";
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
      <span className="inline-flex w-fit shrink-0 self-start items-center gap-1 rounded-full bg-pf-accent-bg px-2 py-1 text-xs font-semibold text-pf-accent">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Configured
      </span>
    );
  }

  if (status === "attention") {
    return (
      <span className="inline-flex w-fit shrink-0 self-start items-center gap-1 rounded-full bg-pf-warning-bg px-2 py-1 text-xs font-semibold text-pf-warning">
        <CircleAlert className="h-3.5 w-3.5" />
        Needs setup
      </span>
    );
  }

  return (
    <span className="inline-flex w-fit shrink-0 self-start items-center gap-1 rounded-full bg-pf-surface px-2 py-1 text-xs font-semibold text-pf-secondary">
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
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
          compact
        title="Settings"
        description="View billing, support, and policies."
      />

      <div className="rounded-lg border border-pf-accent-line bg-pf-accent-bg p-3 text-sm text-pf-accent">
        <p className="font-semibold">Settlement policy</p>
        <p className="mt-1">
          PhenoFarm bills only grower subscriptions. Wholesale payment stays between licensed businesses.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-pf-line bg-pf-surface shadow-sm">
          <div className="border-b border-pf-line bg-pf-canvas px-4 py-3">
            <h2 className="text-base font-semibold text-pf-text">Grower billing</h2>
            <p className="mt-1 text-sm text-pf-muted">Stripe subscription readiness.</p>
          </div>
          <div className="border-b border-pf-line bg-pf-warning-bg px-4 py-3 text-xs text-pf-warning">
            {subscriptionConfig.some((item) => item.status === "attention") ? providerSetupLocation : "Stripe settings are ready for testing."}
          </div>
          <div className="divide-y divide-pf-line">
            {subscriptionConfig.filter(item => item.status === 'attention').map(item => (
              <div key={item.label} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-pf-text">{item.label}</p>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-1 text-xs text-pf-muted">{item.helper}</p>
              </div>
            ))}
          </div>
          {subscriptionConfig.some(item => item.status === 'ready') && <details className="border-t border-pf-line px-4 py-1">
            <summary className="min-h-10 cursor-pointer py-2 text-sm font-medium text-pf-secondary">{subscriptionConfig.filter(item => item.status === 'ready').length} configured</summary>
            <div className="mt-3 space-y-3">
              {subscriptionConfig.filter(item => item.status === 'ready').map(item => (
                <div key={item.label} className="flex items-start justify-between gap-3"><span className="text-sm text-pf-secondary">{item.label}</span><StatusBadge status={item.status} /></div>
              ))}
            </div>
          </details>}

        </section>

        <section className="rounded-lg border border-pf-line bg-pf-surface shadow-sm">
          <div className="border-b border-pf-line bg-pf-canvas px-4 py-3">
            <h2 className="text-base font-semibold text-pf-text">Support</h2>
          </div>
          <dl className="divide-y divide-pf-line">
            {supportProfile.map((item) => (
              <div key={item.label} className="grid min-w-0 gap-1 px-4 py-3">
                <dt className="text-sm font-medium text-pf-muted">{item.label}</dt>
                <dd className="text-sm font-semibold text-pf-text">
                  {item.value === supportEmail ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`mailto:${supportEmail}`}
                        className="inline-flex min-h-10 items-center break-all text-pf-accent hover:text-pf-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
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

        <section className="rounded-lg border border-pf-line bg-pf-surface shadow-sm lg:col-span-2">
          <div className="border-b border-pf-line bg-pf-canvas px-4 py-3">
            <h2 className="text-base font-semibold text-pf-text">Policies</h2>
          </div>
          <div className="divide-y divide-pf-line">
            {operationalPolicies.map(item => (
              <details key={item.label} className="group px-4">
                <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 py-3 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1 text-sm font-semibold text-pf-text">{item.label}</span>
                  <span className="text-right text-xs text-pf-muted">{item.value}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-pf-muted transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="pb-3 text-xs leading-5 text-pf-muted">{item.helper}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

    </div>
  );
}
