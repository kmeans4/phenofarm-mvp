'use client';

export type TableDensity = 'comfortable' | 'compact';

interface TableDensityControlProps {
  value: TableDensity;
  onChange: (value: TableDensity) => void;
  label?: string;
}

export function TableDensityControl({
  value,
  onChange,
  label = 'Density',
}: TableDensityControlProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-pf-muted">{label}</span>
      <div className="inline-flex rounded-lg border border-pf-line bg-pf-canvas p-1">
        {(['comfortable', 'compact'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            aria-pressed={value === mode}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
              value === mode
                ? 'bg-pf-surface text-pf-accent shadow-sm ring-1 ring-pf-accent-line'
                : 'text-pf-muted hover:bg-pf-surface'
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 ring-offset-pf-canvas`}
          >
            {mode === 'comfortable' ? 'Comfort' : 'Compact'}
          </button>
        ))}
      </div>
    </div>
  );
}

export function readDensityPreference(key: string, fallback: TableDensity = 'comfortable'): TableDensity {
  if (typeof window === 'undefined') return fallback;
  const saved = window.localStorage.getItem(key);
  return saved === 'compact' || saved === 'comfortable' ? saved : fallback;
}

export function saveDensityPreference(key: string, value: TableDensity) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, value);
}
