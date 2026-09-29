'use client';

import { useState } from 'react';
import { AnimatePresence, m as motion } from 'framer-motion';
import {
  ClipboardList,
  FileCheck2,
  Handshake,
  MessagesSquare,
  Package,
  Search,
  Store,
  Truck,
} from 'lucide-react';
import { SectionHeading } from './motion';

const flows = {
  grower: {
    label: 'For growers',
    steps: [
      {
        title: 'Add your products',
        description: 'List products with batch details, stock, and lab files. Choose whether to show a price.',
        icon: Package,
      },
      {
        title: 'Answer price requests',
        description: 'Reply to buyers, discuss a price, and keep the conversation in one place.',
        icon: MessagesSquare,
      },
      {
        title: 'Manage order requests',
        description: 'Review requests and update their status as you prepare and deliver each order.',
        icon: Truck,
      },
      {
        title: 'Review delivered orders',
        description: 'See delivered request totals, top products, and your customers.',
        icon: Handshake,
      },
    ],
  },
  dispensary: {
    label: 'For dispensaries',
    steps: [
      {
        title: 'Find products',
        description: 'Search listings from approved growers and filter by product details.',
        icon: Search,
      },
      {
        title: 'Ask for a price',
        description: 'Request pricing for a product and review the grower’s offer before ordering.',
        icon: Store,
      },
      {
        title: 'Send an order request',
        description: 'Add products to your cart, review quantities and delivery details, then send the request.',
        icon: ClipboardList,
      },
      {
        title: 'Follow and reorder',
        description: 'Check request status and add priced, in-stock items from a delivered order back to your cart.',
        icon: FileCheck2,
      },
    ],
  },
} as const;

type Persona = keyof typeof flows;

export function Personas() {
  const [persona, setPersona] = useState<Persona>('grower');
  const steps = flows[persona].steps;

  return (
    <section className="relative border-t border-white/[0.06] py-28 md:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="For your business"
          title="What growers and dispensaries can do"
          lede="Each business can see the same order details and status."
        />

        <div className="mt-9 flex justify-center">
          <div className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] p-1" role="tablist" aria-label="Choose your role">
            {(Object.keys(flows) as Persona[]).map((key) => (
              <button
                key={key}
                role="tab"
                aria-selected={persona === key}
                onClick={() => setPersona(key)}
                className={`relative rounded-full px-6 py-2.5 text-sm font-medium transition-colors ${
                  persona === key ? 'text-gray-950' : 'text-gray-400 hover:text-white'
                }`}
              >
                {persona === key && (
                  <motion.span
                    layoutId="persona-tab"
                    className="absolute inset-0 rounded-full bg-white"
                    transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">{flows[key].label}</span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={persona}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.06] md:grid-cols-4"
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
