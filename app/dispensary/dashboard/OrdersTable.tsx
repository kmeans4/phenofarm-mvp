'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { DateRangeFilter, DateRange, isDateInRange } from '@/app/components/ui/DateRangeFilter';
import { EmptyState } from '@/app/components/ui/EmptyState';
import { Badge } from '@/app/components/ui/Badge';
import { getOrderStatusLabel } from '@/lib/order-workflow';

interface Order {
  id: string;
  orderId: string;
  status: string;
  createdAt: string;
  totalAmount: number;
  growerId: string;
  grower: { businessName: string } | null;
}

interface OrdersTableProps {
  orders: Order[];
}

const statusLabels: Record<string, string> = {
  PENDING: getOrderStatusLabel('PENDING'),
  CONFIRMED: getOrderStatusLabel('CONFIRMED'),
  PROCESSING: getOrderStatusLabel('PROCESSING'),
  SHIPPED: getOrderStatusLabel('SHIPPED'),
  DELIVERED: getOrderStatusLabel('DELIVERED'),
  CANCELLED: getOrderStatusLabel('CANCELLED'),
};

export function OrdersTable({ orders }: OrdersTableProps) {
  const hasLast7DayOrders = orders.some(order => 
    isDateInRange(new Date(order.createdAt), 'last7days')
  );
  const [dateRange, setDateRange] = useState<DateRange>(hasLast7DayOrders ? 'last7days' : 'all');

  const filteredOrders = orders.filter(order => 
    isDateInRange(new Date(order.createdAt), dateRange)
  );

  if (orders.length === 0) {
    return (
      <div className="px-6 pb-6">
        <EmptyState
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          title="No requests yet"
          description="Start browsing grower catalogs and submit your first request. Your request history will appear here."
          action={{ label: 'Browse Catalog', href: '/dispensary/catalog' }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Recent Requests</h3>
          {!hasLast7DayOrders && dateRange === 'all' && (
            <p className="mt-1 text-sm text-gray-500">No requests were submitted in the last 7 days, so all requests are shown.</p>
          )}
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {filteredOrders.length > 0 ? (
        <>
          <div className="space-y-3 md:hidden">
            {filteredOrders.map((order) => (
              <div key={order.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">#{order.orderId}</p>
                    <p className="mt-1 text-sm text-gray-600 truncate">{order.grower?.businessName || 'Unknown'}</p>
                  </div>
                  <Badge variant={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'error' : order.status === 'PENDING' ? 'warning' : order.status === 'PROCESSING' ? 'info' : 'default'}>
                    {statusLabels[order.status] || order.status}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Date</p>
                    <p className="font-medium text-gray-900">{format(new Date(order.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Est. value</p>
                    <p className="font-semibold text-gray-900">${Number(order.totalAmount).toFixed(2)}</p>
                  </div>
                </div>

                <Link
                  href={'/dispensary/orders/' + order.id}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  View request
                </Link>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grower</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">#{order.orderId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.grower?.businessName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{format(new Date(order.createdAt), 'M/d/yyyy')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${Number(order.totalAmount).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'error' : order.status === 'PENDING' ? 'warning' : order.status === 'PROCESSING' ? 'info' : 'default'}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="py-8">
          <EmptyState
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            title="No requests in selected period"
            description={`No requests found for the selected date range (${dateRange === 'today' ? 'Today' : dateRange === 'last7days' ? 'Last 7 Days' : dateRange === 'last30days' ? 'Last 30 Days' : dateRange === 'thisMonth' ? 'This Month' : dateRange === 'lastMonth' ? 'Last Month' : 'All Time'}).`}
          />
        </div>
      )}
    </div>
  );
}
