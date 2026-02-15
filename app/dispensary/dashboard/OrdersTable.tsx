'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { DateRangeFilter, DateRange, isDateInRange } from '@/app/components/ui/DateRangeFilter';
import { EmptyState } from '@/app/components/ui/EmptyState';
import { Badge } from '@/app/components/ui/Badge';

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
  PENDING: 'Pending', CONFIRMED: 'Confirmed', PROCESSING: 'Processing',
  SHIPPED: 'Shipped', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
};

export function OrdersTable({ orders }: OrdersTableProps) {
  const [dateRange, setDateRange] = useState<DateRange>('last7days');

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
          title="No orders yet"
          description="Start browsing grower catalogs and place your first order. Your order history will appear here."
          action={{ label: 'Browse Catalog', href: '/dispensary/catalog' }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {filteredOrders.length > 0 ? (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grower</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
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
      ) : (
        <div className="py-8">
          <EmptyState
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            title="No orders in selected period"
            description={`No orders found for the selected date range (${dateRange === 'today' ? 'Today' : dateRange === 'last7days' ? 'Last 7 Days' : dateRange === 'last30days' ? 'Last 30 Days' : dateRange === 'thisMonth' ? 'This Month' : dateRange === 'lastMonth' ? 'Last Month' : 'All Time'}).`}
          />
        </div>
      )}
    </div>
  );
}
