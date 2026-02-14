'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Badge } from '@/app/components/ui/Badge';
import { format } from 'date-fns';

interface Order {
  id: string;
  orderId: string;
  status: string;
  createdAt: Date;
  totalAmount: unknown;
  grower: { businessName: string } | null;
}

interface StatusLabelMap {
  [key: string]: string;
}

type BadgeVariant = 'info' | 'error' | 'default' | 'success' | 'secondary' | 'warning' | 'danger' | null;

interface OrdersTableProps {
  orders: Order[];
}

const statusLabels: StatusLabelMap = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const getBadgeVariant = (status: string): BadgeVariant => {
  if (status === 'DELIVERED') return 'success';
  if (status === 'CANCELLED') return 'error';
  if (status === 'SHIPPED') return 'warning';
  if (status === 'PENDING') return 'warning';
  if (status === 'CONFIRMED') return 'info';
  return 'default';
};

type SortField = 'date' | 'status' | 'total' | 'orderId';
type SortDirection = 'asc' | 'desc';

export function OrdersTable({ orders: initialOrders }: OrdersTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filter orders based on search and status
  const filteredOrders = useMemo(() => {
    let result = [...initialOrders];

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(order => 
        order.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => 
        order.orderId.toLowerCase().includes(query) ||
        order.grower?.businessName?.toLowerCase().includes(query)
      );
    }

    // Sort orders
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'total':
          comparison = Number(a.totalAmount) - Number(b.totalAmount);
          break;
        case 'orderId':
          comparison = a.orderId.localeCompare(b.orderId);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [initialOrders, searchQuery, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th 
                className="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('orderId')}
              >
                <div className="flex items-center gap-1">
                  Order # {getSortIcon('orderId')}
                </div>
              </th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Grower</th>
              <th 
                className="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center gap-1">
                  Date {getSortIcon('date')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('total')}
              >
                <div className="flex items-center gap-1">
                  Total {getSortIcon('total')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status {getSortIcon('status')}
                </div>
              </th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'No orders match your filters' 
                    : 'No orders yet'}
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">#{order.orderId}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {order.grower?.businessName || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {format(new Date(order.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">
                    ${Number(order.totalAmount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={getBadgeVariant(order.status)}>
                      {statusLabels[order.status] || order.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link 
                      href={'/dispensary/orders/' + order.id}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Results count */}
      {filteredOrders.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredOrders.length} of {initialOrders.length} orders
        </div>
      )}
    </>
  );
}
