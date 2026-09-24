import Link from 'next/link';
import { ChevronDown, Mail, ShieldCheck } from 'lucide-react';

const SUPPORT_EMAIL = 'support@phenoshop.app';

const faqGroups = [
  {
    title: 'For growers',
    description: 'Catalog, quote, request, and subscription basics for cultivator teams.',
    items: [
      {
        question: 'How do I publish products for buyers?',
        answer:
          'Growers manage strains, batches, inventory, product records, documents, and availability from the grower workspace. Listings can show catalog pricing or use quote messaging when terms need to be confirmed first.',
      },
      {
        question: 'What happens when a dispensary submits a request?',
        answer:
          'PhenoFarm creates a wholesale request for the grower to review. Requests move through the friendly status flow: Submitted, Accepted, Preparing, Ready / In transit, Delivered, or Cancelled.',
      },
      {
        question: 'Can growers send quote terms before accepting a request?',
        answer:
          'Yes. The messaging workflow supports structured quote terms such as quantity, unit price, and notes. Quote terms are recorded for coordination, but the buyer and grower still handle payment directly.',
      },
      {
        question: 'What payments does PhenoFarm process for growers?',
        answer:
          'Only the cultivator software subscription is paid through PhenoFarm using Stripe Billing. Wholesale invoices, ACH, checks, cash-on-delivery, and other settlement terms stay directly between the licensed businesses.',
      },
    ],
  },
  {
    title: 'For dispensaries',
    description: 'How verified buyers browse, draft requests, and coordinate fulfillment.',
    items: [
      {
        question: 'Why can I browse but not submit an order request?',
        answer:
          'Dispensary ordering is gated by license verification. New dispensary accounts can submit license details after signup, and ordering unlocks after PhenoFarm verifies the license.',
      },
      {
        question: 'How do I request products from growers?',
        answer:
          'Use the catalog or grower shop pages to add products to a request draft. During review, confirm quantities, fulfillment details, requested timing, and direct payment terms. If the draft includes multiple growers, PhenoFarm creates one request per grower.',
      },
      {
        question: 'How do quote requests work?',
        answer:
          'If pricing or availability needs confirmation, use messaging to request a quote. Growers can send structured terms, and buyers can accept, reject, or counter. Accepted quote terms help both sides coordinate the order request.',
      },
      {
        question: 'Does PhenoFarm collect wholesale payment from dispensaries?',
        answer:
          'No. PhenoFarm tracks request value and fulfillment status for marketplace operations, but it does not collect, remit, escrow, or pay out wholesale order funds.',
      },
    ],
  },
  {
    title: 'Account & billing',
    description: 'Access, verification, billing, and support expectations for the MVP.',
    items: [
      {
        question: 'How do password resets work?',
        answer:
          'Choose Forgot password on the sign-in page. A single-use link expires after 30 minutes. Resetting confirms ownership of your email and signs out all previous sessions.',
      },
      {
        question: 'Why do I need to verify my email?',
        answer: 'Every account, including existing accounts, needs mailbox verification before sign-in. Choose Resend verification on the sign-in page, open the link within an hour, and enter your account password. Email verification does not replace business license review. To change your login email, choose Change email in settings and confirm the new mailbox.',
      },
      {
        question: 'Where do I update business or license details?',
        answer:
          'Growers and dispensaries can update profile details in their settings. Dispensary license changes may require admin review before ordering access is considered verified.',
      },
      {
        question: 'How does the cultivator subscription work?',
        answer:
          'Grower accounts can manage Free, Pro, or Business subscription access from grower settings. Stripe checkout starts paid subscriptions, and the Stripe customer portal becomes available after checkout.',
      },
      {
        question: 'How do I reach PhenoFarm support?',
        answer:
          `Email ${SUPPORT_EMAIL} for account access, license verification, order workflow, quote, catalog, or subscription questions.`,
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
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-white shadow-[0_0_24px_rgba(16,185,129,0.35)]">
                PF
              </span>
              <span className="text-lg font-semibold tracking-tight">PhenoFarm</span>
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
                Verification, requests, quotes, settlement, and subscriptions.
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
            <p className="font-semibold">Payment model reminder</p>
            <p className="mt-1 text-emerald-100/80">
              PhenoFarm never processes wholesale payments. Buyers and growers settle directly; the only in-app payment flow is the cultivator subscription.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
