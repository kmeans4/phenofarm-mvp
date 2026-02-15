'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { DateRangeFilter, DateRange, isDateInRange } from '@/app/components/ui/DateRangeFilter';
import { EmptyState } from '@/app/components/ui/EmptyState';

interface ActivityItemData {
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
  type: 'order' | 'customer' | 'product' | 'sync';
  title: string;
  subtitle: string;
  timestamp: Date;
  status?: 'success' | 'pending' | 'error';
}

function ActivityItem({ type, title, subtitle, timestamp, status }: ActivityItemProps) {
  const icons = {
    order: '📦',
    customer: '👤',
    product: '🌱',
    sync: '🔄',
  };

  const colors = {
    order: 'bg-blue-100 text-blue-800',
    customer: 'bg-purple-100 text-purple-800',
    product: 'bg-green-100 text-green-800',
    sync: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="flex gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colors[type]}`}>
        <span className="text-xl">{icons[type]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        <p className="text-sm text-gray-500 truncate">{subtitle}</p>
        <p className="text-xs text-gray-400 mt-1">
          {format(timestamp, 'MMM d, h:mm a')}
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
    </div>
  );
}

export function ActivityFeed({ orders }: ActivityFeedProps) {
  const [dateRange, setDateRange] = useState<DateRange>('last7days');

  const filteredOrders = orders.filter(order => 
    isDateInRange(new Date(order.createdAt), dateRange)
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>
      
      {filteredOrders.length > 0 ? (
        <div className="space-y-0">
          {filteredOrders.map((order) => (
            <ActivityItem
              key={order.orderId}
              type="order"
              title={`Order #${order.orderId}`}
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
            description={`No orders found for the selected date range (${dateRange === 'today' ? 'Today' : dateRange === 'last7days' ? 'Last 7 Days' : dateRange === 'last30days' ? 'Last 30 Days' : dateRange === 'thisMonth' ? 'This Month' : dateRange === 'lastMonth' ? 'Last Month' : 'All Time'}).`}
          />
        </div>
      )}
    </div>
  );
}
