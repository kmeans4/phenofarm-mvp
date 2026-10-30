'use client';
import { useId, useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { formatMoney } from '@/lib/format';
export function ReportRanking({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: { name: string; value: number; detail: string }[];
}) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const highest = Math.max(...items.map((item) => item.value), 0);
  return (
    <section
      aria-labelledby={id}
      className="min-w-0 rounded-xl border border-pf-line bg-pf-surface"
    >
      <div className="border-b border-pf-line p-4">
        <h2 id={id} className="font-semibold">
          {title}
        </h2>
        <p className="mt-1 text-sm text-pf-muted">{description}</p>
      </div>
      {items.length ? (
        <>
          <ol className="divide-y divide-pf-line">
            {(expanded ? items : items.slice(0, 5)).map((item, index) => (
              <li key={`${item.name}-${index}`} className="p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                  <span className="min-w-0 flex-1 basis-36 break-words">
                    <span className="mr-2 text-pf-muted">{index + 1}.</span>
                    {item.name}
                  </span>
                  <span className="ml-auto max-w-full text-right">
                    <strong className="block break-words tabular-nums text-pf-accent">
                      {formatMoney(item.value)}
                    </strong>
                    <span className="text-pf-muted">{item.detail}</span>
                  </span>
                </div>
                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-pf-raised"
                  aria-hidden="true"
                >
                  <div
                    className="h-full rounded-full bg-pf-accent"
                    style={{
                      width: `${highest > 0 ? Math.max(0, (item.value / highest) * 100) : 0}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ol>
          {items.length > 5 && (
            <Button
              variant="outline"
              className="m-3"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show top 5' : `Show all ${items.length}`}
            </Button>
          )}
        </>
      ) : (
        <p className="p-5 text-sm text-pf-muted">
          No delivered orders in this range.
        </p>
      )}
    </section>
  );
}
