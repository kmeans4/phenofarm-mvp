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
    q: 'What product records can we keep?',
    a: 'Listings carry strain, batch, THC/CBD, and COA lab documents (potency, pesticide, microbial).',
  },
  {
    q: 'How do we evaluate it?',
    a: 'Create a free account — the Free tier includes the full catalog and request workflow. Cultivators upgrade to Pro when they\'re ready to run live volume.',
  },
];

export function Faq() {
  return (
    <section id="faq" className="relative scroll-mt-20 border-t border-white/[0.06] py-28 md:py-36">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeading eyebrow="FAQ" title="Straight answers" />

        <div className="mt-14 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.06] bg-white/[0.015]">
          {FAQS.map((faq, i) => (
            <details key={faq.q} name="landing-faq" open={i === 0} className="group">
              <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left [&::-webkit-details-marker]:hidden">
                <span className="text-[15px] font-medium text-gray-300 group-open:text-white">{faq.q}</span>
                <Plus className="h-4 w-4 shrink-0 text-gray-500 transition-transform group-open:rotate-45 group-open:text-emerald-400 motion-reduce:transition-none" />
              </summary>
              <p className="px-6 pb-6 text-sm leading-relaxed text-gray-400">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
