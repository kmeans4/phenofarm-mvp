export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="space-y-4 animate-pulse"
    >
      <div className="h-9 w-48 rounded-lg bg-pf-raised" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-lg bg-pf-raised" />
        <div className="h-24 rounded-lg bg-pf-raised" />
      </div>
      <div className="h-64 rounded-lg bg-pf-raised" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
