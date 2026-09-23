import Link from 'next/link';

interface RolePrimaryActionProps {
  eyebrow?: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  secondaryHref?: string;
  secondaryCta?: string;
}

export function RolePrimaryAction({
  eyebrow = 'Recommended next action',
  title,
  description,
  href,
  cta,
  secondaryHref,
  secondaryCta,
}: RolePrimaryActionProps) {
  return (
    <section className="rounded-xl border border-pf-accent-line bg-pf-accent-bg p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-pf-accent">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-semibold text-pf-accent">{title}</h2>
          <p className="mt-1 text-sm text-pf-accent">{description}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {secondaryHref && secondaryCta && (
            <Link
              href={secondaryHref}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-pf-accent-line bg-pf-surface px-4 text-sm font-semibold text-pf-accent hover:bg-pf-accent-bg"
            >
              {secondaryCta}
            </Link>
          )}
          <Link
            href={href}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-[#032116] hover:bg-emerald-400"
          >
            {cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
