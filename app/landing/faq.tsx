import { Plus } from 'lucide-react';
import { SectionHeading } from './motion';

const FAQS = [
  {
    q: 'Who can send an order request?',
    a: 'Dispensaries can browse products while their license is being reviewed. They can send order requests after our team approves their license.',
  },
  {
    q: 'Can growers hide their prices?',
    a: 'Yes. A grower can show a price on a product or ask buyers to request a quote. Buyers and growers can discuss an offer before it is accepted.',
  },
  {
    q: 'What happens if I withdraw a request?',
    a: "A buyer can withdraw a request before the grower accepts it. Requests do not reserve stock. Withdrawing a request leaves inventory unchanged, and the request stays in order history.",
  },
  {
    q: 'Can I reorder something I bought before?',
    a: 'From a delivered order, you can add priced products that are still in stock back to your cart. Review current details before sending a new request.',
  },
  {
    q: 'Can growers add lab reports?',
    a: 'Yes. Growers can attach lab reports to batches. Buyers can download available reports from listings or ask the grower for more information.',
  },
  {
    q: 'How much does it cost to get started?',
    a: 'You can create a free account. Growers on the free plan can list up to 50 products. Contact us if you need a larger catalog.',
  },
  {
    q: 'Can I pay for a wholesale order in PhenoShop?',
    a: 'No. The buyer and grower arrange invoicing and payment directly. PhenoShop shows the order value and status, but does not track whether payment was made.',
  },
];

export function Faq() {
  return (
    <section
      id="faq"
      className="relative scroll-mt-20 border-t border-white/[0.06] py-28 md:py-36"
    >
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeading
          eyebrow="Common questions"
          title="Good to know before you start"
        />

        <div className="mt-14 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.06] bg-white/[0.015]">
          {FAQS.map((faq, i) => (
            <details
              key={faq.q}
              name="landing-faq"
              open={i === 0}
              className="group"
            >
              <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left [&::-webkit-details-marker]:hidden">
                <span className="text-[15px] font-medium text-gray-300 group-open:text-white">
                  {faq.q}
                </span>
                <Plus className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-45 group-open:text-emerald-400 motion-reduce:transition-none" />
              </summary>
              <p className="px-6 pb-6 text-sm leading-relaxed text-gray-400">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
