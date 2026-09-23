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
  critical: 'border-pf-danger-line bg-pf-danger-bg text-pf-danger',
  warning: 'border-pf-warning-line bg-pf-warning-bg text-pf-warning',
  info: 'border-pf-info-line bg-pf-info-bg text-pf-info',
};

export function GuidedFixPanel({
  title = 'Fix blocked workflows',
  description = 'Resolve the highest-friction setup gaps first.',
  fixes,
}: GuidedFixPanelProps) {
  if (fixes.length === 0) return null;

  return (
    <section className="rounded-xl border border-pf-warning-line bg-pf-warning-bg/70 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-pf-warning">Guided fixes</p>
          <h2 className="mt-1 text-lg font-semibold text-pf-warning">{title}</h2>
          <p className="mt-1 text-sm text-pf-warning">{description}</p>
        </div>
        <span className="self-start rounded-full bg-pf-surface px-3 py-1 text-xs font-semibold text-pf-warning ring-1 ring-pf-warning-line">
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
