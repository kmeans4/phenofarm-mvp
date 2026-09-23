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
    <div className="flex min-h-10 items-center justify-between gap-2 text-xs text-gray-500">
      <span role="status">{label} {formatSavedAt(savedAt)}</span>
      {onClear && <button type="button" onClick={onClear} className="min-h-10 px-2 font-medium text-green-700">Clear draft</button>}
    </div>
  );

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 sm:flex-row sm:items-center sm:justify-between">
      <span>
        <span className="font-medium">{label}</span> {formatSavedAt(savedAt)}. Nothing is submitted until you use the primary action.
      </span>
      {onClear && (
        <button type="button" onClick={onClear} className="self-start text-xs font-semibold text-blue-700 hover:text-blue-900 sm:self-auto">
          Clear draft
        </button>
      )}
    </div>
  );
}
