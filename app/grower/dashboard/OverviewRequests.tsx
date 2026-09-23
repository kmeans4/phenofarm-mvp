'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, ClipboardList } from 'lucide-react';
import { getOrderStatusLabel } from '@/lib/order-workflow';

export interface OverviewRequest {
  id: string;
  orderId: string;
  buyer: string;
  value: number;
  status: string;
}

export function OverviewRequests({ pending, inProgress, pendingCount, inProgressCount }: {
  pending: OverviewRequest[]; inProgress: OverviewRequest[]; pendingCount: number; inProgressCount: number;
}) {
  const [view, setView] = useState<'new' | 'progress'>(pendingCount > 0 ? 'new' : 'progress');
  const requests = view === 'new' ? pending : inProgress;
  return (
    <section className="pf-panel flex flex-col" aria-labelledby="overview-requests-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pf-line px-4 py-3 sm:px-5">
        <h2 id="overview-requests-title" className="text-base font-semibold">Needs attention</h2>
        <div className="flex gap-1 rounded-lg border border-pf-line p-1" aria-label="Request view">
          {([['new', 'New', pendingCount], ['progress', 'In progress', inProgressCount]] as const).map(([key, label, count]) => (
            <button key={key} type="button" aria-pressed={view === key} onClick={() => setView(key)} className={`inline-flex min-h-9 items-center gap-2 rounded-md px-2.5 text-xs font-medium transition-colors ${view === key ? 'bg-pf-accent-bg text-pf-accent' : 'text-pf-muted hover:bg-pf-raised'}`}>
              {label}<span className="rounded-full bg-white/5 px-1.5 tabular-nums">{count}</span>
            </button>
          ))}
        </div>
      </div>
      {requests.length ? (
        <div className="px-3 sm:px-4">
          <div className="hidden grid-cols-[1fr_1.7fr_.9fr_1fr_16px] gap-3 border-b border-pf-line px-1 py-2.5 text-[11px] uppercase tracking-wide text-pf-muted lg:grid" aria-hidden="true"><span>Request</span><span>Buyer</span><span className="text-right">Est. value</span><span>Status</span><span /></div>
          {requests.map(request => (
            <Link key={request.id} href={`/grower/orders/${request.id}`} className="grid grid-cols-[1fr_auto_16px] items-center gap-x-3 gap-y-1 border-b border-pf-line px-1 py-3.5 text-sm last:border-0 hover:bg-pf-raised lg:grid-cols-[1fr_1.7fr_.9fr_1fr_16px]">
              <span className="min-w-0 truncate text-xs text-pf-muted lg:text-sm" title={request.orderId}>#{request.orderId}</span>
              <span className="col-start-1 row-start-1 min-w-0 truncate font-medium lg:col-auto lg:row-auto">{request.buyer}</span>
              <span className="col-start-2 row-start-1 text-right tabular-nums lg:col-auto lg:row-auto">${request.value.toLocaleString()}</span>
              <span className={`col-start-2 row-start-2 whitespace-nowrap rounded-full border px-2 py-0.5 text-center text-[11px] lg:col-auto lg:row-auto ${request.status === 'PENDING' ? 'border-pf-warning-line bg-pf-warning-bg text-pf-warning' : 'border-pf-accent-line bg-pf-accent-bg text-pf-accent'}`}>{getOrderStatusLabel(request.status)}</span>
              <ChevronRight className="col-start-3 row-span-2 row-start-1 h-4 w-4 text-pf-muted lg:col-auto lg:row-span-1 lg:row-auto" />
            </Link>
          ))}
        </div>
      ) : <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 py-10 text-center"><ClipboardList className="h-7 w-7 text-pf-muted" /><p className="text-sm font-medium">{view === 'new' ? 'No new requests' : 'No requests in progress'}</p><p className="text-xs text-pf-muted">Buyer requests will appear here.</p></div>}
      <Link href="/grower/orders" className="mt-auto flex min-h-11 items-center gap-2 border-t border-pf-line px-4 py-3 text-sm font-medium text-pf-accent hover:bg-pf-raised sm:px-5">View all requests <ArrowRight className="h-4 w-4" /></Link>
    </section>
  );
}
