'use client';

import { motion } from 'framer-motion';

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
      'Settlement staying direct was the deciding factor. PhenoFarm organizes the workflow without taking a position in the transaction.',
    author: 'David Kim',
    role: 'Operations Director, Elevate Wellness',
    initials: 'DK',
  },
];

const principles = [
  'Built for licensed operators',
  'Verification before ordering',
  'Recorded quote terms',
  'Direct settlement, always',
];

export function Testimonials() {
  return (
    <section className="relative border-t border-white/[0.06] py-28 md:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Operators</p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-white md:text-[2.6rem] md:leading-[1.15]">
            Trusted where trust is the product
          </h2>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.figure
              key={testimonial.author}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, delay: index * 0.08 }}
              className="flex flex-col justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7"
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
            </motion.figure>
          ))}
        </div>

        {/* Principles strip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-3"
        >
          {principles.map((principle) => (
            <span key={principle} className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-gray-600">
              <span className="h-1 w-1 rounded-full bg-emerald-500/70" aria-hidden />
              {principle}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
