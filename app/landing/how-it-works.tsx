'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Package, MessagesSquare, Truck, Handshake, Store, ClipboardList, Search, FileCheck2 } from 'lucide-react';

const flows = {
  grower: [
    {
      title: 'Publish your catalog',
      description: 'List products with strains, batches, COAs, and stock. Show prices openly or quote on request.',
      icon: Package,
    },
    {
      title: 'Field requests and quotes',
      description: 'Verified dispensaries submit order requests; negotiate terms in a recorded thread.',
      icon: MessagesSquare,
    },
    {
      title: 'Fulfill with shared status',
      description: 'Accept, prepare, and deliver — the buyer watches the same timeline you update.',
      icon: Truck,
    },
    {
      title: 'Invoice on your terms',
      description: 'Settle directly with the buyer. PhenoFarm keeps the record, never the money.',
      icon: Handshake,
    },
  ],
  dispensary: [
    {
      title: 'Browse verified growers',
      description: 'One catalog across licensed cultivators — filter by strain, type, potency, and stock.',
      icon: Search,
    },
    {
      title: 'Build a request draft',
      description: 'Assemble quantities across growers, set logistics and direct payment terms, submit once.',
      icon: Store,
    },
    {
      title: 'Track every request',
      description: 'Saved products, price alerts, and a live status board for everything in flight.',
      icon: ClipboardList,
    },
    {
      title: 'Reorder in two clicks',
      description: 'Delivered requests become templates — rebuild a proven order from history.',
      icon: FileCheck2,
    },
  ],
} as const;

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState<'grower' | 'dispensary'>('grower');
  const steps = flows[activeTab];

  return (
    <section id="how-it-works" className="relative border-t border-white/[0.06] py-28 md:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">How it works</p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-white md:text-[2.6rem] md:leading-[1.15]">
            Two sides. One shared workflow.
          </h2>

          <div
            className="mt-9 inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] p-1"
            role="tablist"
            aria-label="Choose your role"
          >
            {(
              [
                { id: 'grower', label: 'For growers' },
                { id: 'dispensary', label: 'For dispensaries' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative rounded-full px-6 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'text-gray-950' : 'text-gray-400 hover:text-white'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.span
                    layoutId="how-tab"
                    className="absolute inset-0 rounded-full bg-white"
                    transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.06] md:grid-cols-4"
          >
            {steps.map((step, index) => (
              <div key={step.title} className="relative bg-[#0a0d0b] p-7">
                <div className="mb-6 flex items-center justify-between">
                  <span className="font-mono text-xs text-emerald-400/80">0{index + 1}</span>
                  <step.icon className="h-5 w-5 text-gray-600" aria-hidden />
                </div>
                <h3 className="text-[15px] font-semibold tracking-tight text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{step.description}</p>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
