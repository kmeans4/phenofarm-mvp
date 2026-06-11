'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Badge } from '@/app/components/ui/Badge';
import {
  readDensityPreference,
  saveDensityPreference,
  TableDensity,
  TableDensityControl,
} from '@/app/components/ux/TableDensityControl';
import { format } from 'date-fns';
import { getOrderStatusLabel } from '@/lib/order-workflow';

interface Order {
  id: string;
  orderId: string;
  status: string;
  createdAt: string | Date;
  totalAmount: number;
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
  PENDING: getOrderStatusLabel('PENDING'),
  CONFIRMED: getOrderStatusLabel('CONFIRMED'),
  PROCESSING: getOrderStatusLabel('PROCESSING'),
  SHIPPED: getOrderStatusLabel('SHIPPED'),
  DELIVERED: getOrderStatusLabel('DELIVERED'),
  CANCELLED: getOrderStatusLabel('CANCELLED'),
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
type OrderView = 'all' | 'waiting-grower' | 'active' | 'delivered';

export function OrdersTable({ orders: initialOrders }: OrdersTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orderView, setOrderView] = useState<OrderView>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [tableDensity, setTableDensity] = useState<TableDensity>('comfortable');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTableDensity(readDensityPreference('phenofarm:density:dispensary-orders'));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleDensityChange = (mode: TableDensity) => {
    setTableDensity(mode);
    saveDensityPreference('phenofarm:density:dispensary-orders', mode);
  };

  const orderViews = useMemo(
    () => [
      { key: 'all' as const, label: 'All', count: initialOrders.length },
      { key: 'waiting-grower' as const, label: 'Waiting on grower', count: initialOrders.filter((order) => order.status === 'PENDING').length },
      { key: 'active' as const, label: 'Active', count: initialOrders.filter((order) => ['CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(order.status)).length },
      { key: 'delivered' as const, label: 'Delivered', count: initialOrders.filter((order) => order.status === 'DELIVERED').length },
    ],
    [initialOrders],
  );

  // Filter orders based on search and status
  const filteredOrders = useMemo(() => {
    let result = [...initialOrders];

    if (orderView === 'waiting-grower') {
      result = result.filter((order) => order.status === 'PENDING');
    } else if (orderView === 'active') {
      result = result.filter((order) => ['CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(order.status));
    } else if (orderView === 'delivered') {
      result = result.filter((order) => order.status === 'DELIVERED');
    }

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
  }, [initialOrders, orderView, searchQuery, statusFilter, sortField, sortDirection]);

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
  const compactMode = tableDensity === 'compact';
  const cellClass = compactMode ? 'px-4 py-1.5 text-xs' : 'px-4 py-3 text-sm';
  const mobileCardClass = compactMode ? 'rounded-xl border border-gray-200 bg-white p-3 shadow-sm' : 'rounded-xl border border-gray-200 bg-white p-4 shadow-sm';

  return (
    <>
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-gray-900">Saved workflow views</p>
          <p className="text-xs text-gray-500">Jump to the requests most likely to need your next action.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {orderViews.map((view) => (
            <button
              key={view.key}
              type="button"
              onClick={() => {
                setOrderView(view.key);
                setStatusFilter('all');
              }}
              aria-pressed={orderView === view.key}
              aria-label={`${view.label}: ${view.count} requests`}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                orderView === view.key
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {view.label}
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                orderView === view.key ? 'bg-white/20 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200'
              }`}>
                {view.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => {
            setOrderView('all');
            setStatusFilter(e.target.value);
          }}
          className="rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
        >
          <option value="all">All Status</option>
          <option value="pending">Submitted</option>
          <option value="confirmed">Accepted</option>
          <option value="processing">Preparing</option>
          <option value="shipped">Ready / In transit</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <div className="sm:self-center">
          <TableDensityControl value={tableDensity} onChange={handleDensityChange} />
        </div>
      </div>

      {/* Mobile order cards */}
      <div className="space-y-3 md:hidden">
        {filteredOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-gray-500">
            {searchQuery || statusFilter !== 'all'
              ? 'No requests match your filters'
              : 'No requests yet'}
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className={mobileCardClass}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">#{order.orderId}</p>
                  <p className="mt-1 text-sm text-gray-600 truncate">
                    {order.grower?.businessName || 'Unknown'}
                  </p>
                </div>
                <Badge variant={getBadgeVariant(order.status)}>
                  {statusLabels[order.status] || order.status}
                </Badge>
              </div>

              <div className={`${compactMode ? 'mt-3' : 'mt-4'} grid grid-cols-2 gap-3 text-sm`}>
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
                className={`${compactMode ? 'mt-3' : 'mt-4'} inline-flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50`}
              >
                View request
              </Link>
            </div>
          ))
        )}
      </div>

      {/* Desktop orders table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th 
                className={`${cellClass} font-medium text-gray-700 cursor-pointer hover:bg-gray-50`}
                onClick={() => handleSort('orderId')}
              >
                <div className="flex items-center gap-1">
                  Request # {getSortIcon('orderId')}
                </div>
              </th>
              <th className={`${cellClass} font-medium text-gray-700`}>Grower</th>
              <th 
                className={`${cellClass} font-medium text-gray-700 cursor-pointer hover:bg-gray-50`}
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center gap-1">
                  Date {getSortIcon('date')}
                </div>
              </th>
              <th 
                className={`${cellClass} font-medium text-gray-700 cursor-pointer hover:bg-gray-50`}
                onClick={() => handleSort('total')}
              >
                <div className="flex items-center gap-1">
                  Est. value {getSortIcon('total')}
                </div>
              </th>
              <th 
                className={`${cellClass} font-medium text-gray-700 cursor-pointer hover:bg-gray-50`}
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status {getSortIcon('status')}
                </div>
              </th>
              <th className={`${cellClass} font-medium text-gray-700`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'No requests match your filters' 
                    : 'No requests yet'}
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className={cellClass}>
                    <div className="font-medium text-gray-900">#{order.orderId}</div>
                  </td>
                  <td className={`${cellClass} text-gray-600`}>
                    {order.grower?.businessName || 'Unknown'}
                  </td>
                  <td className={`${cellClass} text-gray-600`}>
                    {format(new Date(order.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className={`${cellClass} font-bold text-gray-900`}>
                    ${Number(order.totalAmount).toFixed(2)}
                  </td>
                  <td className={cellClass}>
                    <Badge variant={getBadgeVariant(order.status)}>
                      {statusLabels[order.status] || order.status}
                    </Badge>
                  </td>
                  <td className={cellClass}>
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
          Showing {filteredOrders.length} of {initialOrders.length} requests
        </div>
      )}
    </>
  );
}
