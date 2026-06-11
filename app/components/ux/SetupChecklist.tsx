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
  const percent = items.length ? Math.round((completeCount / items.length) * 100) : 0;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-semibold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-600">{completeCount} of {items.length} complete</p>
        </div>
        <div className="min-w-[140px]">
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-green-600" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-1 text-right text-xs font-medium text-gray-500">{percent}% ready</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 lg:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            aria-label={`${item.label}: ${item.description} ${item.complete ? 'Complete' : item.cta || 'Finish setup'}`}
            className={`rounded-lg border p-3 transition hover:shadow-sm ${
              item.complete
                ? 'border-green-200 bg-green-50 text-green-950'
                : 'border-amber-200 bg-amber-50 text-amber-950'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                item.complete ? 'bg-green-600 text-white' : 'bg-amber-400 text-amber-950'
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
    </section>
  );
}
