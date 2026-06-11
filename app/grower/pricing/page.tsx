import Link from "next/link";
import { CheckCircle2, Settings, ShieldCheck } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Starter access for setup and early catalog work.",
    features: ["Create a grower profile", "Add catalog products", "Coordinate direct settlement terms"],
  },
  {
    name: "Pro",
    price: "$49",
    description: "Subscription plan for active cultivators using PhenoFarm with buyers.",
    features: ["Expanded catalog listings", "Estimated request value reports", "Priority grower support"],
  },
  {
    name: "Business",
    price: "$149",
    description: "Higher-capacity subscription for larger operator workflows.",
    features: ["Business plan support", "Advanced integrations readiness", "Expanded marketplace operations"],
  },
];

export default function GrowerPricing() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Cultivator Subscription Plans</h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">
            Manage your PhenoFarm software subscription from settings. Buyer-seller wholesale payment is never
            collected in the app.
          </p>
        </div>
        <Link
          href="/grower/settings"
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 sm:w-auto"
        >
          <Settings className="h-4 w-4" />
          Manage subscription
        </Link>
      </div>

      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-950">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-green-700" />
          <div>
            <p className="font-semibold">Subscription fees go from cultivators to PhenoFarm.</p>
            <p className="mt-1">
              Quote, request, fulfillment, and direct-settlement terms can be coordinated here, but wholesale invoices
              are handled directly between businesses.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <section key={plan.name} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{plan.name}</h2>
                <p className="mt-1 text-sm text-gray-600">{plan.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{plan.price}</p>
                <p className="text-xs text-gray-500">/mo</p>
              </div>
            </div>

            <ul className="mt-5 space-y-3 text-sm text-gray-700">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-green-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">How to change plans</h2>
        <p className="mt-2 text-sm text-gray-600">
          Open grower settings to start Stripe Billing checkout, upgrade to Business, or manage an existing
          subscription in the Stripe customer portal.
        </p>
        <div className="mt-4">
          <Link
            href="/grower/settings"
            className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Open grower settings
          </Link>
        </div>
      </section>
    </div>
  );
}
