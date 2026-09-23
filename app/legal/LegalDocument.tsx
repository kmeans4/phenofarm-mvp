import Link from 'next/link';

export interface LegalSection {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

interface LegalDocumentProps {
  title: string;
  description: string;
  sections: LegalSection[];
}

const LAST_UPDATED = 'July 6, 2026';
const SUPPORT_EMAIL = 'support@phenofarm.com';

export function LegalDocument({ title, description, sections }: LegalDocumentProps) {
  return (
    <main className="min-h-screen bg-[#070908] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-20rem] h-[42rem] w-[58rem] -translate-x-1/2 rounded-full bg-emerald-500/[0.09] blur-[140px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        <nav className="mb-10 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070908]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-white shadow-[0_0_24px_rgba(16,185,129,0.35)]">
              PF
            </span>
            <span className="text-lg font-semibold tracking-tight">PhenoFarm</span>
          </Link>
          <Link href="/help" className="rounded-full border border-white/[0.10] px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-emerald-300/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070908]">
            Help
          </Link>
        </nav>

        <header className="rounded-3xl border border-white/[0.06] bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.25)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">Legal</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{title}</h1>
          <p className="mt-4 text-sm font-medium text-gray-300">Last updated: {LAST_UPDATED}</p>
          <p className="mt-6 max-w-3xl text-base leading-7 text-gray-400">{description}</p>
          <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] p-4 text-sm leading-6 text-amber-100">
            <p className="font-semibold">Pre-launch draft pending counsel review.</p>
            <p className="mt-1 text-amber-100/80">
              This MVP copy is intended to describe current product behavior and is not a substitute for legal advice or final production terms.
              No wholesale payment data is processed by PhenoFarm; buyer-seller settlement is handled directly outside the app.
            </p>
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[16rem_1fr]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.035] p-5">
              <p className="text-sm font-semibold text-white">Contents</p>
              <ol className="mt-4 space-y-3">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="inline-flex min-h-10 items-center text-sm leading-5 text-gray-400 transition-colors hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070908]">
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </aside>

          <article className="space-y-5">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.035] p-5 sm:p-6">
                <h2 className="text-2xl font-semibold tracking-tight text-white">{section.title}</h2>
                <div className="mt-4 space-y-4 text-sm leading-7 text-gray-300">
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.bullets && (
                    <ul className="space-y-2 pl-5">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="list-disc text-gray-300">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}

            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/[0.06] p-5 text-sm leading-6 text-emerald-50">
              <p className="font-semibold">Questions or requests?</p>
              <p className="mt-1 text-emerald-100/80">
                Contact{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="inline-flex min-h-10 items-center font-medium text-emerald-200 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070908]">
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
