
import { BrandLogo } from '@/app/components/ui/BrandLogo';
import Link from 'next/link';
import { ChevronDown, Mail, ShieldCheck } from 'lucide-react';

const SUPPORT_EMAIL = 'support@phenoshop.app';

const faqGroups = [
  {
    title: 'For growers',
    description: 'List products, respond to buyers, and manage your account.',
    items: [
      {
        question: 'How do I publish products for buyers?',
        answer:
          'Go to Products and choose Add product. Enter the product details, price, and stock, then choose Publish product. Choose Save draft to finish later. To keep a price private, select Quote only so buyers can ask for pricing. Your account and license must be approved before listings appear to buyers.',
      },
      {
        question: 'What happens when a dispensary submits a request?',
        answer:
          'PhenoShop creates a wholesale request for the grower to review. You can track each request as it moves through: Submitted, Accepted, Preparing, Ready / In transit, Delivered, or Cancelled.',
      },
      {
        question: 'Can growers send quote terms before accepting a request?',
        answer:
          'Yes. Open a product conversation in Messages and send a quote with a unit price, quantity, and any notes. The buyer can accept, decline, or suggest another price. Payment is arranged directly between you and the buyer.',
      },
      {
        question: 'What payments does PhenoShop process for growers?',
        answer:
          'PhenoShop uses Stripe for paid grower subscriptions. Buyers and growers arrange payment for wholesale orders directly with each other.',
      },
    ],
  },
  {
    title: 'For dispensaries',
    description: 'Find products, send order requests, and track deliveries.',
    items: [
      {
        question: 'Why can I browse but not submit an order request?',
        answer:
          'Add your license details in Settings after signup. You can browse while we review them. Once your license is approved, you can send order requests.',
      },
      {
        question: 'How do I request products from growers?',
        answer:
          'Choose Add to cart in the catalog or a grower’s shop. Open Cart to review quantities, pickup or delivery, timing, and payment terms. Choose Review request, then Send order request. If you have products from multiple growers, each grower receives a separate request.',
      },
      {
        question: 'How do quote requests work?',
        answer:
          'Choose Request pricing on a product to message the grower. You can accept a quote, decline it, or suggest another price. Once you accept, choose Add to cart to use the agreed price in an order request.',
      },
      {
        question: 'Does PhenoShop collect wholesale payment from dispensaries?',
        answer:
          'No. PhenoShop shows order amounts and progress. Arrange invoices and payment directly with the grower.',
      },
    ],
  },
  {
    title: 'Account & billing',
    description: 'Sign-in, license review, plans, and support.',
    items: [
      {
        question: 'How do password resets work?',
        answer:
          'Choose Forgot password on the sign-in page. A single-use link expires after 30 minutes. Resetting confirms ownership of your email and signs you out on other devices.',
      },
      {
        question: 'Why do I need to verify my email?',
        answer: 'Verify your email before signing in. Choose Resend verification email on the sign-in page, open the link within an hour, and enter your account password. Your business license is reviewed separately. To update your sign-in address, choose Change email in Settings.',
      },
      {
        question: 'Where do I update business or license details?',
        answer:
          'Growers and dispensaries can update profile details in their settings. Changes to a dispensary license may need review before you can send order requests again.',
      },
      {
        question: 'How does the cultivator subscription work?',
        answer:
          'Open Settings to see your grower plan. When paid upgrades are available, choose Upgrade to Pro to subscribe through Stripe. After subscribing, choose Manage billing to update or cancel your plan.',
      },
      {
        question: 'How do I reach PhenoShop support?',
        answer:
          `Email ${SUPPORT_EMAIL} for account access, license verification, orders, quotes, products, or subscriptions.`,
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[#070908] text-white">
      <section className="relative overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-20rem] h-[42rem] w-[58rem] -translate-x-1/2 rounded-full bg-emerald-500/[0.10] blur-[140px]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <nav className="flex items-center justify-between gap-4">
            <Link href="/" className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070908]">
              <BrandLogo className="w-40" />
            </Link>
            <Link href="/auth/sign_in" className="rounded-full border border-white/[0.10] px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-emerald-300/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070908]">
              Sign in
            </Link>
          </nav>

          <div className="grid gap-10 py-16 lg:grid-cols-[1fr_22rem] lg:items-end">
            <div>
              <h1 className="mt-0 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Marketplace help
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-gray-400">
                Find answers about accounts, products, orders, and billing.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                  <Mail className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Need support?</p>
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="inline-flex min-h-10 items-center text-sm text-emerald-300 transition-colors hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070908]">
                    {SUPPORT_EMAIL}
                  </a>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-400">
                Include your business name, role, and the page or request you need help with.
              </p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {faqGroups.map((group) => (
              <section key={group.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.035] p-5">
                <div className="flex items-start gap-3">
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold text-white">{group.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-gray-400">{group.description}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {group.items.map((item) => (
                    <details key={item.question} className="group rounded-xl border border-white/[0.06] bg-[#0d120f] p-4">
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-semibold text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d120f] [&::-webkit-details-marker]:hidden">
                        <span>{item.question}</span>
                        <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300 transition-transform group-open:rotate-180" />
                      </summary>
                      <p className="mt-3 text-sm leading-6 text-gray-400">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-emerald-300/20 bg-emerald-400/[0.06] p-5 text-sm leading-6 text-emerald-50">
            <p className="font-semibold">Payments</p>
            <p className="mt-1 text-emerald-100/80">
              Arrange wholesale payments directly with your buyer or grower. Only paid grower subscriptions are billed through PhenoShop.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
