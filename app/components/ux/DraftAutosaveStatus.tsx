'use client';

interface DraftAutosaveStatusProps {
  savedAt: string | null;
  label?: string;
  onClear?: () => void;
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
}: DraftAutosaveStatusProps) {
  if (!savedAt) return null;

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
