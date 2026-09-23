import Link from 'next/link';

export interface ChecklistItem {
  label: string;
  description: string;
  href: string;
  complete: boolean;
  cta?: string;
}

interface SetupChecklistProps {
  eyebrow?: string;
  title: string;
  items: ChecklistItem[];
}

export function SetupChecklist({ eyebrow = 'Setup checklist', title, items }: SetupChecklistProps) {
  const completeCount = items.filter((item) => item.complete).length;
  const pending = items.filter((item) => !item.complete);
  const completed = items.filter((item) => item.complete);

  return (
    <section className="rounded-xl border border-pf-line bg-pf-surface p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-pf-muted">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-semibold text-pf-text">{title}</h2>
          <p className="mt-1 text-sm text-pf-muted">{pending.length ? `${pending.length} remaining` : 'All set'}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 lg:grid-cols-2">
        {pending.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            aria-label={`${item.label}: ${item.description} ${item.complete ? 'Complete' : item.cta || 'Finish setup'}`}
            className={`rounded-lg border p-3 transition hover:shadow-sm ${
              item.complete
                ? 'border-pf-accent-line bg-pf-accent-bg text-pf-accent'
                : 'border-pf-warning-line bg-pf-warning-bg text-pf-warning'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                item.complete ? 'bg-emerald-500 text-[#032116]' : 'bg-pf-warning-bg text-pf-warning'
              }`} aria-hidden="true">
                {item.complete ? 'OK' : '!'}
              </span>
              <div className="min-w-0">
                <p className="font-semibold">{item.label}</p>
                <p className="mt-1 text-sm opacity-80">{item.description}</p>
                <p className="mt-2 text-xs font-semibold">{item.complete ? 'Complete' : item.cta || 'Finish setup'}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {completeCount > 0 && <details className="mt-2 text-sm">
        <summary className="cursor-pointer py-2 text-pf-accent">{completeCount} completed</summary>
        <div className="flex flex-wrap gap-2 pt-2">{completed.map(item => <Link key={item.label} href={item.href} className="rounded-lg bg-pf-accent-bg px-3 py-2 text-pf-accent">{item.label} ✓</Link>)}</div>
      </details>}
    </section>
  );
}
