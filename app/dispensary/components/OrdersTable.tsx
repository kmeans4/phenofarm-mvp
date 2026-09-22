'use client';

import { useState, useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  hasUnreadMessages?: boolean;
  createdBy?: string;
  buyerAcknowledgedAt?: string | Date | null;
  grower: { businessName: string } | null;
}

interface StatusLabelMap {
  [key: string]: string;
}

type BadgeVariant = 'info' | 'error' | 'default' | 'success' | 'secondary' | 'warning' | 'danger' | null;

interface OrdersTableProps {
  orders: Order[];
  compact?: boolean;
  maxRows?: number;
  showFilters?: boolean;
  showWorkflowViews?: boolean;
  showResultCount?: boolean;
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
type OrderView = 'all' | 'waiting-grower' | 'active' | 'delivered' | 'cancelled';

function shortOrderId(orderId: string) {
  const suffix = orderId.split('-').at(-1) || orderId;
  return suffix.length >= 4 ? suffix : orderId.slice(-8);
}

function subscribeDensity(callback: () => void) {
  window.addEventListener('storage', callback); window.addEventListener('dispensary-density', callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener('dispensary-density', callback); };
}
function densitySnapshot() {
  try { return readDensityPreference('phenofarm:density:dispensary-orders'); } catch { return 'comfortable' as const; }
}

export function OrdersTable({
  orders: initialOrders,
  compact = false,
  maxRows,
  showFilters = true,
  showWorkflowViews = true,
  showResultCount = true,
}: OrdersTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [orderView, setOrderView] = useState<OrderView>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const storedDensity = useSyncExternalStore(subscribeDensity, densitySnapshot, () => 'comfortable' as const);
  const tableDensity = compact ? 'compact' : storedDensity;
  const handleDensityChange = (mode: TableDensity) => {
    if (compact) return;
    try { saveDensityPreference('phenofarm:density:dispensary-orders', mode); window.dispatchEvent(new Event('dispensary-density')); } catch { /* Optional preference. */ }
  };

  const orderViews = useMemo(
    () => [
      { key: 'all' as const, label: 'All', count: initialOrders.length },
      { key: 'waiting-grower' as const, label: 'Waiting on grower', count: initialOrders.filter((order) => order.status === 'PENDING').length },
      { key: 'active' as const, label: 'Active', count: initialOrders.filter((order) => ['CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(order.status)).length },
      { key: 'delivered' as const, label: 'Delivered', count: initialOrders.filter((order) => order.status === 'DELIVERED').length },
      { key: 'cancelled' as const, label: 'Cancelled', count: initialOrders.filter((order) => order.status === 'CANCELLED').length },
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
    } else if (orderView === 'cancelled') {
      result = result.filter((order) => order.status === 'CANCELLED');
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
  }, [initialOrders, orderView, searchQuery, sortField, sortDirection]);
  const visibleOrders = typeof maxRows === 'number' ? filteredOrders.slice(0, maxRows) : filteredOrders;
  const navigateToOrder = (orderId: string) => {
    router.push(`/dispensary/orders/${orderId}`);
  };

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
  const compactMode = compact || tableDensity === 'compact';
  const cellClass = compactMode ? 'px-4 py-1.5 text-xs' : 'px-4 py-3 text-sm';
  const mobileCardClass = 'rounded-xl border border-gray-200 bg-white p-3 shadow-sm';

  return (
    <>
      {showWorkflowViews && (
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
      )}

      {/* Filters */}
      {showFilters && (
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
          <div className="sm:self-center">
            <TableDensityControl value={tableDensity} onChange={handleDensityChange} />
          </div>
        </div>
      )}

      {/* Mobile order cards */}
      <div className="space-y-2 md:hidden">
        {filteredOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-gray-500">
            {searchQuery
              ? 'No requests match your filters'
              : 'No requests yet'}
          </div>
        ) : (
          visibleOrders.slice(0, compact ? 3 : visibleOrders.length).map((order) => (
            <Link key={order.id} href={`/dispensary/orders/${order.id}`} aria-label={`View request ${order.orderId}`}
              className={`${mobileCardClass} block transition-colors hover:border-green-200 hover:bg-green-50/40 focus-visible:ring-2 focus-visible:ring-green-600`}>
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-gray-900" title={order.orderId}>
                  #{shortOrderId(order.orderId)}
                  <time dateTime={new Date(order.createdAt).toISOString()} title={format(new Date(order.createdAt), 'MMM d, yyyy')} className="text-xs font-normal text-gray-500">{format(new Date(order.createdAt), 'MMM d, yy')}</time>
                  {order.hasUnreadMessages ? <span className="h-2 w-2 shrink-0 rounded-full bg-green-600" aria-label="Unread grower message" /> : null}
                </span>
                <Badge variant={getBadgeVariant(order.status)}>{statusLabels[order.status] || order.status}</Badge>
              </div>
              <div className="mt-1 flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="break-words text-gray-700">{order.grower?.businessName || 'Unknown grower'}</p>
                </div>
                <span className="shrink-0 font-semibold text-gray-900">${Number(order.totalAmount).toFixed(2)}</span>
              </div>
              {order.createdBy === 'GROWER' ? <p className="mt-1 text-xs text-blue-800">Recorded by grower{order.buyerAcknowledgedAt ? ' · Confirmed' : ''}</p> : null}
            </Link>
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
                aria-sort={sortField === 'orderId' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <button type="button" onClick={() => handleSort('orderId')} className="flex w-full items-center gap-1 text-left focus-visible:ring-2 focus-visible:ring-green-600">
                  Request # {getSortIcon('orderId')}
                </button>
              </th>
              <th className={`${cellClass} font-medium text-gray-700`}>Grower</th>
              <th 
                className={`${cellClass} font-medium text-gray-700 cursor-pointer hover:bg-gray-50`}
                aria-sort={sortField === 'date' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <button type="button" onClick={() => handleSort('date')} className="flex w-full items-center gap-1 text-left focus-visible:ring-2 focus-visible:ring-green-600">
                  Date {getSortIcon('date')}
                </button>
              </th>
              <th 
                className={`${cellClass} font-medium text-gray-700 cursor-pointer hover:bg-gray-50`}
                aria-sort={sortField === 'total' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <button type="button" onClick={() => handleSort('total')} className="flex w-full items-center gap-1 text-left focus-visible:ring-2 focus-visible:ring-green-600">
                  Est. value {getSortIcon('total')}
                </button>
              </th>
              <th 
                className={`${cellClass} font-medium text-gray-700 cursor-pointer hover:bg-gray-50`}
                aria-sort={sortField === 'status' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <button type="button" onClick={() => handleSort('status')} className="flex w-full items-center gap-1 text-left focus-visible:ring-2 focus-visible:ring-green-600">
                  Status {getSortIcon('status')}
                </button>
              </th>
              <th className={`${cellClass} font-medium text-gray-700`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {visibleOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  {searchQuery
                    ? 'No requests match your filters' 
                    : 'No requests yet'}
                </td>
              </tr>
            ) : (
              visibleOrders.map((order) => (
                <tr
                  key={order.id}
                  role="link"
                  tabIndex={0}
                  aria-label={`View request ${order.orderId}`}
                  onClick={() => navigateToOrder(order.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigateToOrder(order.id);
                    }
                  }}
                  className="cursor-pointer transition-colors hover:bg-green-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-600"
                >
                  <td className={cellClass}>
                    <div className="flex items-center gap-2 font-medium text-gray-900">
                      #{order.orderId}
                      {order.hasUnreadMessages ? (
                        <span className="h-2 w-2 rounded-full bg-green-600" title="Unread grower message" aria-label="Unread grower message" />
                      ) : null}
                    </div>
                    {order.createdBy === 'GROWER' ? <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-800">Recorded by grower{order.buyerAcknowledgedAt ? ' · Confirmed' : ''}</span> : null}
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
                      onClick={(event) => event.stopPropagation()}
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
      {showResultCount && filteredOrders.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          Showing {visibleOrders.length} of {initialOrders.length} requests
        </div>
      )}
    </>
  );
}
