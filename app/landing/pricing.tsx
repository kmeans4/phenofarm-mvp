'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Free Trial',
    description: 'Test our platform risk-free',
    price: { monthly: 0, annual: 0 },
    features: [
      '30-day free trial',
      'Basic features included',
      'Standard support',
      'Up to 50 product listings',
      'Basic analytics',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Wholesale Pro',
    description: 'Complete platform for serious businesses',
    price: { monthly: 249, annual: 199 },
    features: [
      'Everything in Free Trial',
      'Unlimited product listings',
      'Advanced analytics',
      'Priority support',
      'CSV bulk upload',
      'Metrc integration ready',
      'API access',
      'Custom branding',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
];

export function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section 
      id="pricing" 
      ref={ref} 
      className="py-24 md:py-32 bg-gray-950 relative min-h-[700px]"
      style={{ contentVisibility: 'auto', contain: 'layout style paint' }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          layout="position"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            Choose the plan that works best for your business. Save 60% compared to traditional platforms.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1 bg-gray-800 rounded-xl">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !isAnnual
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                isAnnual
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Annual
              <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              layout="position"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              className={`relative p-8 rounded-2xl ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-green-900/50 to-gray-900 border-2 border-green-500/50 shadow-xl shadow-green-500/10'
                  : 'bg-gray-900/50 border border-gray-800 hover:border-gray-700'
              }`}
              style={{ willChange: 'transform, opacity' }}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-4 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold rounded-full shadow-lg">
                    <Sparkles className="w-4 h-4" />
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </div>

              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-white">
                    ${isAnnual ? plan.price.annual : plan.price.monthly}
                  </span>
                  <span className="text-gray-400">/mo</span>
                </div>
                {isAnnual && plan.price.monthly > 0 && (
                  <p className="text-gray-500 text-sm mt-2">
                    Billed ${plan.price.annual * 12}/year
                  </p>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/auth/sign_up"
                className={`block w-full py-4 rounded-xl text-center font-semibold transition-all ${
                  plan.highlighted
                    ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/25'
                    : 'bg-gray-800 hover:bg-gray-700 text-white'
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
