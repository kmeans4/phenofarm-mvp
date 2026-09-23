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
    order: 'bg-blue-100 text-blue-800',
    customer: 'bg-purple-100 text-purple-800',
    product: 'bg-green-100 text-green-800',
    sync: 'bg-yellow-100 text-yellow-800',
  };
  const ActivityIcon = icons[type];

  return (
    <Link href={href} className="-mx-2 flex min-h-10 gap-4 rounded-lg border-b border-gray-100 px-2 py-4 transition-colors last:border-0 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2">
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colors[type]}`}>
        <ActivityIcon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        <p className="text-sm text-gray-500 truncate">{subtitle}</p>
        <p className="text-xs text-gray-400 mt-1">
          {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(timestamp)}
          {status && (
            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
              status === 'success' ? 'bg-green-100 text-green-800' :
              status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {status}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}

export function ActivityFeed({ orders }: ActivityFeedProps) {
  const [dateRange, setDateRange] = useState<DateRange>('last30days');

  const filteredOrders = orders.filter(order => 
    isDateInRange(new Date(order.createdAt), dateRange)
  );
  const showAllTimeFallback = dateRange === 'last30days' && filteredOrders.length === 0 && orders.length > 0;
  const displayedOrders = showAllTimeFallback ? orders : filteredOrders;

  return (
    <div>
      <div className="pt-1 sm:pt-2 mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Recent activity</h2>
        <div className="flex flex-wrap items-center gap-3">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <Link href="/grower/orders" className="text-sm font-medium text-green-700 hover:underline">All requests</Link>
        </div>
      </div>
      
      {showAllTimeFallback && (
        <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800">
          Showing all time — nothing in the last 30 days.
        </div>
      )}

      {displayedOrders.length > 0 ? (
        <div className="space-y-0">
          {displayedOrders.map((order) => (
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
        <div className="py-8">
          <EmptyState
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            title="No activity in selected period"
            description={`No requests found for the selected date range (${dateRange === 'today' ? 'Today' : dateRange === 'last7days' ? 'Last 7 Days' : dateRange === 'last30days' ? 'Last 30 Days' : dateRange === 'thisMonth' ? 'This Month' : dateRange === 'lastMonth' ? 'Last Month' : 'All Time'}).`}
          />
        </div>
      )}
    </div>
  );
}
