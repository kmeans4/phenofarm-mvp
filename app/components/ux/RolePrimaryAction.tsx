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
    <section className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-700">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-semibold text-green-950">{title}</h2>
          <p className="mt-1 text-sm text-green-900">{description}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {secondaryHref && secondaryCta && (
            <Link
              href={secondaryHref}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-green-200 bg-white px-4 text-sm font-semibold text-green-800 hover:bg-green-100"
            >
              {secondaryCta}
            </Link>
          )}
          <Link
            href={href}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700"
          >
            {cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
