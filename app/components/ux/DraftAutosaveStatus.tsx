'use client';

interface DraftAutosaveStatusProps {
  savedAt: string | null;
  label?: string;
  onClear?: () => void;
  compact?: boolean;
}

function formatSavedAt(savedAt: string) {
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return 'saved';
  return `saved ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

export function DraftAutosaveStatus({
  savedAt,
  label = 'Browser draft',
  onClear,
  compact = false,
}: DraftAutosaveStatusProps) {
  if (!savedAt) return null;

  if (compact) return (
    <div className="flex min-h-10 items-center justify-between gap-2 text-xs text-pf-muted">
      <span role="status">{label} {formatSavedAt(savedAt)}</span>
      {onClear && <button type="button" onClick={onClear} className="min-h-10 px-2 font-medium text-pf-accent">Clear draft</button>}
    </div>
  );

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-pf-info-line bg-pf-info-bg px-3 py-2 text-sm text-pf-info sm:flex-row sm:items-center sm:justify-between">
      <span>
        <span className="font-medium">{label}</span> {formatSavedAt(savedAt)}. Not submitted.
      </span>
      {onClear && (
        <button type="button" onClick={onClear} className="self-start text-xs font-semibold text-pf-info hover:text-pf-info sm:self-auto">
          Clear draft
        </button>
      )}
    </div>
  );
}
