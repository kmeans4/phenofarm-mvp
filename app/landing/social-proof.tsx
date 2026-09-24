import { SectionHeading, Reveal } from './motion';

const testimonials = [
  {
    quote:
      'The verification gate changed how we onboard partners. If a buyer can submit a request, we already know their license cleared review.',
    author: 'Marcus Johnson',
    role: 'Founder, Valley Green Farms',
    initials: 'MJ',
  },
  {
    quote:
      'Quotes, counters, and the final terms live in one thread. When a delivery lands, nobody argues about what was agreed.',
    author: 'Sarah Chen',
    role: 'Owner, Green Mountain Dispensary',
    initials: 'SC',
  },
  {
    quote:
      'Settlement staying direct was the deciding factor. PhenoShop organizes the workflow without taking a position in the transaction.',
    author: 'David Kim',
    role: 'Operations Director, Elevate Wellness',
    initials: 'DK',
  },
];

export function SocialProof() {
  return (
    <section className="relative border-t border-white/[0.06] py-28 md:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading eyebrow="Operators" title="Trusted where trust is the product" />

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Reveal as="figure"
              key={testimonial.author}
              delay={index * 0.08}
              className="flex flex-col justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 transition-[transform,border-color] motion-safe:hover:-translate-y-1 hover:border-emerald-500/20"
            >
              <blockquote className="text-pretty text-[15px] leading-relaxed text-gray-300">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-7 flex items-center gap-3 border-t border-white/[0.05] pt-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
                  {testimonial.initials}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{testimonial.author}</div>
                  <div className="text-xs text-gray-500">{testimonial.role}</div>
                </div>
              </figcaption>
            </Reveal>
          ))}
        </div>

        <p className="mt-8 text-center text-[11px] text-gray-600">Illustrative customer scenarios.</p>
      </div>
    </section>
  );
}
