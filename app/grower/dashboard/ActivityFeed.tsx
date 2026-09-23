'use client';

import { useState } from 'react';
import { DateRangeFilter, DateRange, isDateInRange } from '@/app/components/ui/DateRangeFilter';
import { EmptyState } from '@/app/components/ui/EmptyState';
import { Package, RefreshCw, Sprout, UserRound, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface ActivityItemData {
  id: string;
  orderId: string;
  dispensaryName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface ActivityFeedProps {
  orders: ActivityItemData[];
  compact?: boolean;
}

interface ActivityItemProps {
  href: string;
  type: 'order' | 'customer' | 'product' | 'sync';
  title: string;
  subtitle: string;
  timestamp: Date;
  status?: 'success' | 'pending' | 'error';
}

function ActivityItem({ href, type, title, subtitle, timestamp, status }: ActivityItemProps) {
  const icons: Record<ActivityItemProps['type'], LucideIcon> = {
    order: Package,
    customer: UserRound,
    product: Sprout,
    sync: RefreshCw,
  };

  const colors = {
    order: 'bg-pf-info-bg text-pf-info',
    customer: 'bg-pf-purple-bg text-pf-purple',
    product: 'bg-pf-accent-bg text-pf-accent',
    sync: 'bg-pf-warning-bg text-pf-warning',
  };
  const ActivityIcon = icons[type];

  return (
    <Link href={href} className="-mx-2 flex min-h-10 gap-3 rounded-lg border-b border-pf-line px-2 py-3 transition-colors last:border-0 hover:bg-pf-accent-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2">
      <div className={`flex-shrink-0 w-9 h-9 rounded-lg border border-pf-line flex items-center justify-center ${colors[type]}`}>
        <ActivityIcon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-pf-text truncate">{title}</p>
        <p className="text-xs text-pf-muted truncate">{subtitle}</p>
        <p className="text-xs text-pf-muted mt-1">
          {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(timestamp)}
          {status && (
            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
              status === 'success' ? 'bg-pf-accent-bg text-pf-accent' :
              status === 'pending' ? 'bg-pf-warning-bg text-pf-warning' :
              'bg-pf-danger-bg text-pf-danger'
            }`}>
              {status}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}

export function ActivityFeed({ orders, compact = false }: ActivityFeedProps) {
  const [expanded, setExpanded] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('last30days');

  const filteredOrders = orders.filter(order => 
    isDateInRange(new Date(order.createdAt), dateRange)
  );
  const showAllTimeFallback = dateRange === 'last30days' && filteredOrders.length === 0 && orders.length > 0;
  const displayedOrders = showAllTimeFallback ? orders : filteredOrders;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-pf-text">Recent activity</h2>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter value={dateRange} onChange={(range) => { setDateRange(range); setExpanded(false); }} />
          <Link href="/grower/orders" className="text-sm font-medium text-pf-accent hover:underline">All requests</Link>
        </div>
      </div>
      
      {showAllTimeFallback && (
        <div className="mb-3 rounded-lg border border-pf-info-line bg-pf-info-bg px-3 py-2 text-sm font-medium text-pf-info">
          Showing all time — nothing in the last 30 days.
        </div>
      )}

      {displayedOrders.length > 0 ? (
        <div className="space-y-0">
          {(compact && !expanded ? displayedOrders.slice(0, 3) : displayedOrders).map((order) => (
            <ActivityItem
              key={order.orderId}
              href={`/grower/orders/${order.id}`}
              type="order"
              title={`Request #${order.orderId}`}
              subtitle={`From ${order.dispensaryName}`}
              timestamp={new Date(order.createdAt)}
            />
          ))}
        </div>
      ) : (
        <div className="py-1">
          <EmptyState
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            title="No recent activity"
            description="Requests in this date range will appear here."
          />
        </div>
      )}
      {compact && displayedOrders.length > 3 && <button type="button" onClick={() => setExpanded(value => !value)} aria-expanded={expanded} className="mt-2 min-h-10 text-xs font-medium text-pf-accent">{expanded ? 'Show less' : `Show all ${displayedOrders.length}`}</button>}
    </div>
  );
}
