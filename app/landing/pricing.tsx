'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Check } from 'lucide-react';
import Link from 'next/link';

// Tier names match the in-app cultivator subscription plans (Free / Pro / Business)
const plans = [
  {
    name: 'Free',
    description: 'Evaluate the marketplace workflow before enabling paid plans',
    price: { monthly: 0, annual: 0 },
    features: [
      'Demo and review access',
      'Catalog and request workflow preview',
      'Up to 50 product listings',
      'Basic marketplace records',
      'Standard support',
    ],
    cta: 'Create Account',
    highlighted: false,
  },
  {
    name: 'Pro',
    description: 'Cultivator subscription for active wholesale teams',
    price: { monthly: 249, annual: 199 },
    features: [
      'Everything in Free',
      'Unlimited product listings',
      'Advanced analytics',
      'CSV bulk upload',
      'Metrc integration ready',
      'Priority support',
    ],
    cta: 'Create Account',
    highlighted: true,
  },
  {
    name: 'Business',
    description: 'For multi-license operations that need deeper integrations',
    price: { monthly: null, annual: null },
    features: [
      'Everything in Pro',
      'API access',
      'Custom branding',
      'Dedicated onboarding',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing" className="relative border-t border-white/[0.06] py-28 md:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Pricing</p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-white md:text-[2.6rem] md:leading-[1.15]">
            One flat subscription. Zero take rate.
          </h2>
          <p className="mt-5 text-pretty leading-relaxed text-gray-400">
            Cultivators pay for software, not per transaction. Wholesale value moves directly
            between businesses — PhenoFarm never touches it.
          </p>

          {/* Billing toggle */}
          <div className="mt-9 inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] p-1">
            {(
              [
                { id: false, label: 'Monthly' },
                { id: true, label: 'Annual · save 20%' },
              ] as const
            ).map((option) => (
              <button
                key={String(option.id)}
                onClick={() => setIsAnnual(option.id)}
                aria-pressed={isAnnual === option.id}
                className={`relative rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  isAnnual === option.id ? 'text-gray-950' : 'text-gray-400 hover:text-white'
                }`}
              >
                {isAnnual === option.id && (
                  <motion.span
                    layoutId="billing-toggle"
                    className="absolute inset-0 rounded-full bg-white"
                    transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">{option.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, delay: index * 0.08 }}
              className={`relative flex flex-col rounded-2xl p-8 ${
                plan.highlighted
                  ? 'border border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.07] to-transparent shadow-[0_0_60px_-20px_rgba(16,185,129,0.35)]'
                  : 'border border-white/[0.06] bg-white/[0.02]'
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                  Most popular
                </span>
              )}

              <div className="mb-7">
                <h3 className="text-lg font-semibold tracking-tight text-white">{plan.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{plan.description}</p>
              </div>

              <div className="mb-7 flex items-baseline gap-1.5">
                {plan.price.monthly === null ? (
                  <span className="text-4xl font-semibold tracking-tight text-white">Custom</span>
                ) : (
                  <>
                    <span className="text-5xl font-semibold tracking-tight text-white">
                      ${isAnnual ? plan.price.annual : plan.price.monthly}
                    </span>
                    <span className="text-sm text-gray-500">/mo</span>
                  </>
                )}
                {isAnnual && (plan.price.monthly ?? 0) > 0 && (
                  <span className="ml-2 text-xs text-gray-600">billed ${(plan.price.annual ?? 0) * 12}/yr</span>
                )}
              </div>

              <ul className="mb-9 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.cta === 'Contact Sales' ? 'mailto:support@phenofarm.com' : '/auth/sign_up'}
                className={`mt-auto inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
                  plan.highlighted
                    ? 'bg-emerald-500 text-white shadow-[0_0_32px_rgba(16,185,129,0.25)] hover:bg-emerald-400'
                    : 'border border-white/10 bg-white/[0.03] text-gray-200 hover:border-white/20 hover:bg-white/[0.06]'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
