import Link from 'next/link';

export interface GuidedFix {
  title: string;
  description: string;
  href: string;
  cta: string;
  severity?: 'critical' | 'warning' | 'info';
}

interface GuidedFixPanelProps {
  title?: string;
  description?: string;
  fixes: GuidedFix[];
}

const severityClasses = {
  critical: 'border-red-200 bg-red-50 text-red-950',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  info: 'border-blue-200 bg-blue-50 text-blue-950',
};

export function GuidedFixPanel({
  title = 'Fix blocked workflows',
  description = 'Resolve the highest-friction setup gaps first.',
  fixes,
}: GuidedFixPanelProps) {
  if (fixes.length === 0) return null;

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Guided fixes</p>
          <h2 className="mt-1 text-lg font-semibold text-amber-950">{title}</h2>
          <p className="mt-1 text-sm text-amber-900">{description}</p>
        </div>
        <span className="self-start rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
          {fixes.length} open
        </span>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {fixes.map((fix) => (
          <Link
            key={fix.title}
            href={fix.href}
            className={`rounded-lg border p-3 transition hover:shadow-sm ${severityClasses[fix.severity || 'warning']}`}
          >
            <p className="font-semibold">{fix.title}</p>
            <p className="mt-1 text-sm opacity-80">{fix.description}</p>
            <p className="mt-2 text-xs font-semibold">{fix.cta}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
