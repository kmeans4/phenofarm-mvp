'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
        title: 'Publish your catalog',
        description: 'Strains, batches, COAs, stock. Show prices openly or quote on request.',
        icon: Package,
      },
      {
        title: 'Field requests & quotes',
        description: 'Verified dispensaries submit requests; negotiate terms in a recorded thread.',
        icon: MessagesSquare,
      },
      {
        title: 'Fulfill with shared status',
        description: 'Accept, prepare, deliver — the buyer watches the same timeline you update.',
        icon: Truck,
      },
      {
        title: 'Invoice on your terms',
        description: 'Settle directly with the buyer. PhenoFarm keeps the record, never the money.',
        icon: Handshake,
      },
    ],
  },
  dispensary: {
    label: 'For dispensaries',
    steps: [
      {
        title: 'Browse verified growers',
        description: 'One catalog across licensed cultivators — filter by strain, type, potency, stock.',
        icon: Search,
      },
      {
        title: 'Build a request draft',
        description: 'Assemble quantities across growers, set logistics and terms, submit once.',
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
          eyebrow="Two sides, one workflow"
          title="Built for both ends of the deal"
          lede="Growers and dispensaries work from the same shared record — no forwarded PDFs, no version drift."
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
