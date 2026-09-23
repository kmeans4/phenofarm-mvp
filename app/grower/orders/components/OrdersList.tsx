'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import {
  readDensityPreference,
  saveDensityPreference,
  TableDensity,
  TableDensityControl,
} from '@/app/components/ux/TableDensityControl';
import {
  getAllowedOrderStatusTransitions,
  getOrderStatusLabel,
  isOrderStatus,
  type OrderStatusValue,
} from '@/lib/order-workflow';
import { formatProductMoney } from '@/lib/product-display';
import { useBodyOverlay } from '@/app/hooks/useBodyOverlay';

interface Order {
  id: string;
  orderId: string;
  status: string;
  createdAt: string;
  totalAmount: number;
  dispensary: {
    businessName: string;
  };
}

interface OrdersListProps {
  initialOrders: Order[];
  customerFilterLabel?: string;
}

type OrderWorkflowView = 'all' | 'needs-review' | 'accepted' | 'preparing' | 'ready' | 'delivered';

interface SkippedOrderDetail {
  id: string;
  orderLabel: string;
  reason: string;
}

interface BatchStatusResponse {
  error?: string;
  updatedCount?: number;
  updatedOrderIds?: unknown[];
  skippedCount?: number;
  noOpCount?: number;
  skippedOrders?: Array<{
    id?: unknown;
    reason?: unknown;
  }>;
}

interface BatchStatusMessage {
  type: 'success' | 'warning' | 'error';
  title: string;
  text: string;
  skippedOrders?: SkippedOrderDetail[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: getOrderStatusLabel('PENDING'),
  CONFIRMED: getOrderStatusLabel('CONFIRMED'),
  PROCESSING: getOrderStatusLabel('PROCESSING'),
  SHIPPED: getOrderStatusLabel('SHIPPED'),
  DELIVERED: getOrderStatusLabel('DELIVERED'),
  CANCELLED: getOrderStatusLabel('CANCELLED'),
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  PROCESSING: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  SHIPPED: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  DELIVERED: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
};

const VIEW_STATUS: Partial<Record<OrderWorkflowView, OrderStatusValue>> = {
  'needs-review': 'PENDING',
  accepted: 'CONFIRMED',
  preparing: 'PROCESSING',
  ready: 'SHIPPED',
  delivered: 'DELIVERED',
};

const ACTION_LABELS: Record<OrderStatusValue, string> = {
  PENDING: 'Submitted',
  CONFIRMED: 'Accept',
  PROCESSING: 'Start preparing',
  SHIPPED: 'Mark ready',
  DELIVERED: 'Mark delivered',
  CANCELLED: 'Cancel',
};

const ACTION_CLASSES: Record<OrderStatusValue, string> = {
  PENDING: 'bg-gray-700 hover:bg-gray-600',
  CONFIRMED: 'bg-blue-600 hover:bg-blue-700',
  PROCESSING: 'bg-purple-600 hover:bg-purple-700',
  SHIPPED: 'bg-orange-600 hover:bg-orange-700',
  DELIVERED: 'bg-green-600 hover:bg-green-700',
  CANCELLED: 'bg-red-600 hover:bg-red-700',
};

export default function OrdersList({ initialOrders, customerFilterLabel }: OrdersListProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  useBodyOverlay(selectedOrders.size > 0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<BatchStatusMessage | null>(null);
  const [workflowView, setWorkflowView] = useState<OrderWorkflowView>('all');
  const [tableDensity, setTableDensity] = useState<TableDensity>('comfortable');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTableDensity(readDensityPreference('phenofarm:density:grower-orders'));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    setOrders(initialOrders);
    setSelectedOrders(new Set());
    setWorkflowView('all');
  }, [initialOrders, customerFilterLabel]);

  const handleDensityChange = (mode: TableDensity) => {
    setTableDensity(mode);
    saveDensityPreference('phenofarm:density:grower-orders', mode);
  };

  const visibleOrders = useMemo(() => {
    if (workflowView === 'needs-review') return orders.filter((order) => order.status === 'PENDING');
    if (workflowView === 'accepted') return orders.filter((order) => order.status === 'CONFIRMED');
    if (workflowView === 'preparing') return orders.filter((order) => order.status === 'PROCESSING');
    if (workflowView === 'ready') return orders.filter((order) => order.status === 'SHIPPED');
    if (workflowView === 'delivered') return orders.filter((order) => order.status === 'DELIVERED');
    return orders;
  }, [orders, workflowView]);

  const workflowViews = useMemo(
    () => [
      { key: 'all' as const, label: 'All', count: orders.length },
      { key: 'needs-review' as const, label: 'Needs review', count: orders.filter((order) => order.status === 'PENDING').length },
      { key: 'accepted' as const, label: 'Accepted', count: orders.filter((order) => order.status === 'CONFIRMED').length },
      { key: 'preparing' as const, label: 'Preparing', count: orders.filter((order) => order.status === 'PROCESSING').length },
      { key: 'ready' as const, label: 'Ready', count: orders.filter((order) => order.status === 'SHIPPED').length },

    ],
    [orders],
  );

  const selectedOrderList = useMemo(
    () => orders.filter((order) => selectedOrders.has(order.id)),
    [orders, selectedOrders],
  );

  const allowedBulkTransitions = useMemo(() => {
    if (selectedOrderList.length === 0) return [];

    const viewStatus = VIEW_STATUS[workflowView];
    const sourceStatuses = viewStatus
      ? [viewStatus]
      : Array.from(new Set(selectedOrderList.map((order) => order.status))).filter(isOrderStatus);

    const transitionSet = new Set<OrderStatusValue>();
    sourceStatuses.forEach((status) => {
      getAllowedOrderStatusTransitions(status).forEach((transition) => {
        if (selectedOrderList.some((order) => getAllowedOrderStatusTransitions(order.status).includes(transition))) {
          transitionSet.add(transition);
        }
      });
    });

    return Array.from(transitionSet);
  }, [selectedOrderList, workflowView]);

  const toggleSelectAll = () => {
    const visibleIds = visibleOrders.map((order) => order.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedOrders.has(id));

    if (allVisibleSelected) {
      setSelectedOrders((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedOrders((prev) => new Set([...Array.from(prev), ...visibleIds]));
    }
  };

  const toggleSelect = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleBatchUpdate = async (newStatus: OrderStatusValue) => {
    if (selectedOrders.size === 0) return;

    setIsUpdating(true);
    setMessage(null);

    try {
      const response = await fetch('/api/orders/batch-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: Array.from(selectedOrders),
          status: newStatus,
        }),
      });

      const result = (await response.json()) as BatchStatusResponse;
      const updatedOrderIds = new Set<string>(
        Array.isArray(result.updatedOrderIds)
          ? result.updatedOrderIds.filter((id: unknown): id is string => typeof id === 'string')
          : [],
      );
      const updatedCount = Number(result.updatedCount ?? updatedOrderIds.size);
      const skippedCount = Number(result.skippedCount ?? 0);
      const noOpCount = Number(result.noOpCount ?? 0);
      const skippedOrders = Array.isArray(result.skippedOrders)
        ? result.skippedOrders.map((skipped) => {
            const id = typeof skipped.id === 'string' ? skipped.id : '';
            const order = orders.find((item) => item.id === id);
            return {
              id,
              orderLabel: order ? `#${order.orderId}` : 'Request',
              reason: typeof skipped.reason === 'string' ? skipped.reason : 'This request cannot move to that status.',
            };
          })
        : [];

      if (!response.ok && updatedCount === 0) {
        setMessage({
          type: 'error',
          title: skippedCount > 0 ? `0 updated, ${skippedCount} skipped` : 'Batch update failed',
          text: result.error || 'Failed to update selected requests.',
          skippedOrders,
        });
        return;
      }

      setOrders(prev => prev.map(order =>
        updatedOrderIds.has(order.id) ? { ...order, status: newStatus } : order
      ));

      const context = [
        noOpCount > 0 ? `${noOpCount} already ${STATUS_LABELS[newStatus]}` : '',
        skippedCount > 0 ? 'Review the skipped reasons below.' : '',
      ].filter(Boolean).join(' ');

      setMessage({
        type: skippedCount > 0 ? 'warning' : 'success',
        title: skippedCount > 0 ? `${updatedCount} updated, ${skippedCount} skipped` : `${updatedCount} updated`,
        text: `Moved ${updatedCount} request${updatedCount !== 1 ? 's' : ''} to ${STATUS_LABELS[newStatus]}.${context ? ` ${context}` : ''}`,
        skippedOrders,
      });
      setSelectedOrders(new Set());
    } catch (err) {
      setMessage({
        type: 'error',
        title: 'Batch update failed',
        text: err instanceof Error ? err.message : 'Update failed'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const hasSelection = selectedOrders.size > 0;
  const compactMode = tableDensity === 'compact';
  const cellClass = compactMode ? 'px-3 sm:px-4 py-1.5 text-xs' : 'px-3 sm:px-4 py-2 sm:py-3 text-sm';

  return (
    <div className="relative">
      {/* Message Toast */}
      {message && (
        <div
          className={`mb-4 rounded-lg border p-4 ${
            message.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : message.type === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold">{message.title}</p>
              <p className="mt-1 text-sm">{message.text}</p>
              {message.skippedOrders && message.skippedOrders.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm">
                  {message.skippedOrders.map((skipped) => (
                    <li key={`${skipped.id}-${skipped.reason}`} className="flex gap-2">
                      <span className="font-medium">{skipped.orderLabel}:</span>
                      <span>{skipped.reason}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              onClick={() => setMessage(null)}
              aria-label="Dismiss update message"
              className="min-h-10 rounded-md px-2 py-1 text-sm opacity-75 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">

        <label className="block sm:hidden"><span className="sr-only">Filter requests</span><select value={workflowView} onChange={(event) => { setWorkflowView(event.target.value as OrderWorkflowView); setSelectedOrders(new Set()); }} className="min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base">{workflowViews.map((view) => <option key={view.key} value={view.key}>{view.label} ({view.count})</option>)}</select></label>
        <div className="hidden flex-wrap gap-2 sm:flex">
          {workflowViews.map((view) => (
            <button
              key={view.key}
              type="button"
              onClick={() => {
                setWorkflowView(view.key);
                setSelectedOrders(new Set());
              }}
              aria-pressed={workflowView === view.key}
              aria-label={`${view.label}: ${view.count} requests`}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 ${
                workflowView === view.key
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{view.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                workflowView === view.key ? 'bg-white/20 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200'
              }`}>
                {view.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={visibleOrders.length > 0 && visibleOrders.every(order => selectedOrders.has(order.id))} onChange={toggleSelectAll} />Select all</label>
            <div className="flex flex-wrap items-center gap-3">
              <div className="hidden sm:block"><TableDensityControl value={tableDensity} onChange={handleDensityChange} /></div>
              {hasSelection && (
                <span className="text-sm text-gray-600">
                  {selectedOrders.size} selected
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {visibleOrders.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {orders.length === 0
                  ? customerFilterLabel
                    ? `No active requests for ${customerFilterLabel}`
                    : 'No active order requests'
                  : 'No requests in this view'}
              </h3>
              <p className="text-gray-500 mb-2 max-w-md mx-auto">
                {orders.length === 0
                  ? customerFilterLabel
                    ? 'Delivered and cancelled requests stay in history. Active requests for this customer will appear here.'
                    : 'You do not have any submitted, accepted, preparing, or ready/in-transit requests right now.'
                  : 'Switch workflow views to see other request states.'}
              </p>
              {orders.length === 0 ? (
                <>
                  <p className="text-sm text-gray-500 mb-6">Next step: record a direct request or wait for buyer requests.</p>
                  <Button variant="primary" asChild>
                    <Link href="/grower/orders/add">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Record direct request
                    </Link>
                  </Button>
                </>
              ) : (
                <Button type="button" variant="secondary" onClick={() => setWorkflowView('all')}>
                  Show all requests
                </Button>
              )}
            </div>
          ) : (
            <>
            <div className="space-y-2 sm:hidden">{visibleOrders.map(order => {
              const colors = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING;
              return <article key={order.id} className="rounded-xl border border-gray-200 p-3">
                <div className="flex items-start gap-2"><label className="flex h-10 w-10 shrink-0 items-center justify-center -ml-2"><input type="checkbox" checked={selectedOrders.has(order.id)} onChange={() => toggleSelect(order.id)} aria-label={`Select request #${order.orderId}`} className="h-4 w-4" /></label><div className="min-w-0"><Link href={`/grower/orders/${order.id}`} className="inline-flex min-h-10 items-center text-sm font-semibold text-green-700 break-all">#{order.orderId}</Link><p className="text-sm text-gray-600">{order.dispensary.businessName}</p></div></div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2"><span className={`rounded-full px-2 py-1 text-xs ${colors.bg} ${colors.text}`}>{STATUS_LABELS[order.status] || order.status}</span><strong className="text-sm">{formatProductMoney(order.totalAmount)}</strong></div>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-gray-500"><span>{format(new Date(order.createdAt), 'MMM d, yyyy')}</span><Link href={`/grower/orders/${order.id}`} className="inline-flex min-h-10 items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-green-700">View →</Link></div>
              </article>;
            })}</div>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className={cellClass}>
                      <input
                        type="checkbox"
                        checked={visibleOrders.length > 0 && visibleOrders.every((order) => selectedOrders.has(order.id))}
                        onChange={toggleSelectAll}
                        onClick={(event) => event.stopPropagation()}
                        aria-label="Select all visible requests"
                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                    </th>
                    <th className={`${cellClass} font-medium text-gray-700`}>Request #</th>
                    <th className={`${cellClass} font-medium text-gray-700`}>Dispensary</th>
                    <th className={`${cellClass} font-medium text-gray-700`}>Date</th>
                    <th className={`${cellClass} font-medium text-gray-700`}>Est. value</th>
                    <th className={`${cellClass} font-medium text-gray-700`}>Status</th>
                    <th className={`${cellClass} font-medium text-gray-700`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {visibleOrders.map((order) => {
                    const colors = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING;
                    return (
                      <tr
                        key={order.id}
                        onClick={() => router.push(`/grower/orders/${order.id}`)}
                        className={`cursor-pointer transition-colors hover:bg-gray-50 ${selectedOrders.has(order.id) ? 'bg-green-50/50' : ''}`}
                      >
                        <td className={cellClass}>
                          <input
                            type="checkbox"
                            checked={selectedOrders.has(order.id)}
                            onChange={() => toggleSelect(order.id)}
                            onClick={(event) => event.stopPropagation()}
                            aria-label={`Select request #${order.orderId}`}
                            className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                        </td>
                        <td className={cellClass}>
                          <div className="font-medium text-gray-900">#{order.orderId}</div>
                        </td>
                        <td className={`${cellClass} text-gray-600`}>
                          {order.dispensary.businessName}
                        </td>
                        <td className={`${cellClass} text-gray-600`}>
                          {format(new Date(order.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className={`${cellClass} font-bold text-gray-900`}>
                          ${Number(order.totalAmount).toFixed(2)}
                        </td>
                        <td className={cellClass}>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colors.bg} ${colors.text} ${colors.border} border`}>
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                        </td>
                        <td className={cellClass}>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/grower/orders/${order.id}`} onClick={(event) => event.stopPropagation()}>
                              View
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Batch Action Toolbar */}
      {hasSelection && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl">
          <div className="bg-gray-900 text-white rounded-xl shadow-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-medium">
                {selectedOrders.size} request{selectedOrders.size !== 1 ? 's' : ''} selected
              </span>
              <button
                type="button"
                onClick={() => setSelectedOrders(new Set())}
                className="min-h-10 rounded-md px-2 py-1 text-sm text-gray-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              >
                Clear
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {allowedBulkTransitions.length > 0 ? (
                allowedBulkTransitions.map((targetStatus) => (
                  <button
                    key={targetStatus}
                    type="button"
                    onClick={() => handleBatchUpdate(targetStatus)}
                    disabled={isUpdating}
                    className={`min-h-10 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${ACTION_CLASSES[targetStatus]}`}
                  >
                    {ACTION_LABELS[targetStatus]}
                  </button>
                ))
              ) : (
                <span className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-gray-300">
                  No bulk transitions available
                </span>
              )}
              <button
                type="button"
                onClick={() => setSelectedOrders(new Set())}
                disabled={isUpdating}
                className="min-h-10 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              >
                Clear selection
              </button>
            </div>

            {isUpdating && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Updating...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
