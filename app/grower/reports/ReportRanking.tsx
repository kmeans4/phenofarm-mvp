'use client';
import { useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { formatMoney } from '@/lib/format';
export function ReportRanking({
  title,
  items,
}: {
  title: string;
  items: { name: string; value: number; detail: string }[];
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <section className="rounded-xl border border-pf-line bg-pf-surface">
      <h2 className="border-b border-pf-line p-4 font-semibold">{title}</h2>
      {items.length ? (
        <>
          <ol className="divide-y divide-pf-line">
            {(expanded ? items : items.slice(0, 5)).map((item, index) => (
              <li
                key={`${item.name}-${index}`}
                className="flex items-center justify-between gap-3 p-4 text-sm"
              >
                <span className="min-w-0 break-words">
                  <span className="mr-2 text-pf-muted">{index + 1}.</span>
                  {item.name}
                </span>
                <span className="shrink-0 text-right">
                  <strong className="block text-pf-accent">
                    {formatMoney(item.value)}
                  </strong>
                  <span className="text-pf-muted">{item.detail}</span>
                </span>
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
