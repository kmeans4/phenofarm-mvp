import Link from 'next/link';
import type { ReactNode } from 'react';

export function OperationsSummary({ items }: { items: { label: string; value: ReactNode; href?: string }[] }) {
  return (
    <div aria-label="Summary" className={`grid gap-2 ${items.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
      {items.map((item) => {
        const content = <div className={items.length === 4 ? 'flex min-h-6 flex-wrap items-center justify-between gap-x-2 sm:block' : ''}><p className="text-xs leading-4 text-pf-muted">{item.label}</p><p className="break-words text-lg font-semibold leading-6 tracking-tight text-pf-text sm:mt-1 sm:text-2xl">{item.value}</p></div>;
        return item.href ? (
          <Link key={item.label} href={item.href} className="min-h-10 min-w-0 rounded-xl border border-pf-line bg-pf-surface px-3 py-2 sm:p-3 hover:border-green-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600">{content}</Link>
        ) : <div key={item.label} className="min-w-0 rounded-xl border border-pf-line bg-pf-surface px-3 py-2 sm:p-3">{content}</div>;
      })}
    </div>
  );
}
