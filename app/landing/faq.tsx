'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { SectionHeading } from './motion';

const FAQS = [
  {
    q: 'Does PhenoFarm process our wholesale payments?',
    a: 'No — deliberately. Order value is tracked for your records only; invoicing and settlement happen directly between buyer and grower on whatever terms you agree. PhenoFarm charges cultivators a flat software subscription and takes 0% of wholesale value.',
  },
  {
    q: 'How does license verification work?',
    a: 'Dispensaries submit license details in settings; the PhenoFarm team reviews them. Until a license is verified, a buyer account can browse but cannot submit order requests — verification is enforced by the order pipeline itself, not just shown as a badge.',
  },
  {
    q: 'What happens when a request is cancelled?',
    a: 'The reserved inventory returns to the grower\'s stock automatically, and the request moves to history with its full record intact — items, terms, and timeline.',
  },
  {
    q: 'Can we keep our prices private?',
    a: 'Yes. Every listing has per-product price visibility: show a list price openly, or mark it quote-only so buyers request pricing and negotiate terms in a recorded thread.',
  },
  {
    q: 'Is PhenoFarm compliance-ready?',
    a: 'Listings carry strain, batch, THC/CBD, and COA lab documents (potency, pesticide, microbial). Metrc integration is prepared for state tracking as it rolls out.',
  },
  {
    q: 'How do we evaluate it?',
    a: 'Create a free account — the Free tier includes the full catalog and request workflow. Cultivators upgrade to Pro when they\'re ready to run live volume.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative scroll-mt-20 border-t border-white/[0.06] py-28 md:py-36">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeading eyebrow="FAQ" title="Straight answers" />

        <div className="mt-14 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.06] bg-white/[0.015]">
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={faq.q}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className={`text-[15px] font-medium transition-colors ${isOpen ? 'text-white' : 'text-gray-300'}`}>
                    {faq.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={`shrink-0 ${isOpen ? 'text-emerald-400' : 'text-gray-500'}`}
                  >
                    <Plus className="h-4 w-4" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-sm leading-relaxed text-gray-400">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
