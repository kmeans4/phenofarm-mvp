import Link from 'next/link';
import { ArrowRight, BadgeCheck, ClipboardList, UserRoundPlus } from 'lucide-react';
import { SectionHeading } from './motion';

const steps = [
  {
    icon: UserRoundPlus,
    title: 'Create a free account',
    description: 'Choose grower or dispensary and add your business details.',
  },
  {
    icon: BadgeCheck,
    title: 'Submit your license',
    description: 'Our team reviews business licenses before growers can appear in the catalog or buyers can send requests.',
  },
  {
    icon: ClipboardList,
    title: 'Work together',
    description: 'Growers can list products. Buyers can browse, ask for prices, and send order requests after approval.',
  },
];

export function GettingStarted() {
  return (
    <section id="getting-started" className="relative scroll-mt-20 border-t border-white/[0.06] py-28 md:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Getting started"
          title="Start with your business details"
          lede="The free grower plan includes up to 50 product listings. Contact us if you need a larger catalog."
        />

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7">
              <div className="mb-6 flex items-center justify-between">
                <step.icon className="h-6 w-6 text-emerald-400" aria-hidden />
                <span className="text-xs text-gray-500">0{index + 1}</span>
              </div>
              <h3 className="text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/auth/sign_up" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-400">
            Create a free account <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link href="/contact" className="inline-flex items-center rounded-xl border border-white/10 px-7 py-3.5 text-sm font-semibold text-gray-200 transition-colors hover:border-white/20 hover:text-white">
            Ask a question
          </Link>
        </div>
      </div>
    </section>
  );
}
