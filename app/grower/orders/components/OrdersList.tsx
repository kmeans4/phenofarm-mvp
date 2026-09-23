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
  PENDING: { bg: 'bg-pf-warning-bg', text: 'text-pf-warning', border: 'border-pf-warning-line' },
  CONFIRMED: { bg: 'bg-pf-info-bg', text: 'text-pf-info', border: 'border-pf-info-line' },
  PROCESSING: { bg: 'bg-pf-purple-bg', text: 'text-pf-purple', border: 'border-pf-purple-line' },
  SHIPPED: { bg: 'bg-pf-warning-bg', text: 'text-pf-warning', border: 'border-pf-warning-line' },
  DELIVERED: { bg: 'bg-pf-accent-bg', text: 'text-pf-accent', border: 'border-pf-accent-line' },
  CANCELLED: { bg: 'bg-pf-danger-bg', text: 'text-pf-danger', border: 'border-pf-danger-line' },
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
  PENDING: 'bg-pf-raised text-pf-text hover:bg-pf-hover',
  CONFIRMED: 'bg-emerald-500 text-[#032116] hover:bg-emerald-400',
  PROCESSING: 'bg-pf-purple-bg text-pf-purple ring-1 ring-inset ring-pf-purple-line hover:bg-pf-purple-bg/80',
  SHIPPED: 'bg-pf-warning-bg text-pf-warning ring-1 ring-inset ring-pf-warning-line hover:bg-pf-warning-bg/80',
  DELIVERED: 'bg-emerald-500 text-[#032116] hover:bg-emerald-400',
  CANCELLED: 'bg-pf-danger-bg text-pf-danger ring-1 ring-inset ring-pf-danger-line hover:bg-pf-danger-bg/80',
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
              ? 'border-pf-accent-line bg-pf-accent-bg text-pf-accent'
              : message.type === 'warning'
                ? 'border-pf-warning-line bg-pf-warning-bg text-pf-warning'
                : 'border-pf-danger-line bg-pf-danger-bg text-pf-danger'
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
              className="min-h-10 rounded-md px-2 py-1 text-sm opacity-75 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 rounded-xl border border-pf-line bg-pf-surface p-3 shadow-sm">

        <label className="block sm:hidden"><span className="sr-only">Filter requests</span><select value={workflowView} onChange={(event) => { setWorkflowView(event.target.value as OrderWorkflowView); setSelectedOrders(new Set()); }} className="min-h-10 w-full rounded-lg border border-pf-line-strong bg-pf-surface px-3 py-2 text-base">{workflowViews.map((view) => <option key={view.key} value={view.key}>{view.label} ({view.count})</option>)}</select></label>
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
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 ${
                workflowView === view.key
                  ? 'bg-pf-accent-bg text-pf-accent ring-1 ring-inset ring-pf-accent-line'
                  : 'bg-pf-canvas text-pf-secondary hover:bg-pf-surface'
              }`}
            >
              <span>{view.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                workflowView === view.key ? 'bg-pf-accent/15 text-pf-accent' : 'bg-pf-surface text-pf-muted ring-1 ring-pf-line'
              }`}>
                {view.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Card className="bg-pf-surface shadow-sm border border-pf-line">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={visibleOrders.length > 0 && visibleOrders.every(order => selectedOrders.has(order.id))} onChange={toggleSelectAll} />Select all</label>
            <div className="flex flex-wrap items-center gap-3">
              <div className="hidden sm:block"><TableDensityControl value={tableDensity} onChange={handleDensityChange} /></div>
              {hasSelection && (
                <span className="text-sm text-pf-muted">
                  {selectedOrders.size} selected
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {visibleOrders.length === 0 ? (
            <div className="text-center px-4 py-8 sm:py-12 border border-pf-line rounded-xl bg-pf-surface">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pf-surface flex items-center justify-center">
                <svg className="w-8 h-8 text-pf-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-pf-text mb-2">
                {orders.length === 0
                  ? customerFilterLabel
                    ? `No active requests for ${customerFilterLabel}`
                    : 'No active order requests'
                  : 'No requests in this view'}
              </h3>
              <p className="text-sm text-pf-muted mb-4 max-w-md mx-auto">
                {orders.length === 0
                  ? customerFilterLabel
                    ? 'Active requests for this customer appear here; closed requests stay in history.'
                    : 'Buyer requests and your direct records will appear here.'
                  : 'Switch workflow views to see other request states.'}
              </p>
              {orders.length === 0 ? (
                <>
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
              return <article key={order.id} className="rounded-xl border border-pf-line p-3">
                <div className="flex items-start gap-2"><label className="flex h-10 w-10 shrink-0 items-center justify-center -ml-2"><input type="checkbox" checked={selectedOrders.has(order.id)} onChange={() => toggleSelect(order.id)} aria-label={`Select request #${order.orderId}`} className="h-4 w-4" /></label><div className="min-w-0"><Link href={`/grower/orders/${order.id}`} className="inline-flex min-h-10 items-center text-sm font-semibold text-pf-accent break-all">#{order.orderId}</Link><p className="text-sm text-pf-muted">{order.dispensary.businessName}</p></div></div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2"><span className={`rounded-full px-2 py-1 text-xs ${colors.bg} ${colors.text}`}>{STATUS_LABELS[order.status] || order.status}</span><strong className="text-sm">{formatProductMoney(order.totalAmount)}</strong></div>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-pf-muted"><span>{format(new Date(order.createdAt), 'MMM d, yyyy')}</span><Link href={`/grower/orders/${order.id}`} className="inline-flex min-h-10 items-center rounded-lg border border-pf-line px-3 py-2 text-sm font-semibold text-pf-accent">View →</Link></div>
              </article>;
            })}</div>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b border-pf-line">
                    <th className={cellClass}>
                      <input
                        type="checkbox"
                        checked={visibleOrders.length > 0 && visibleOrders.every((order) => selectedOrders.has(order.id))}
                        onChange={toggleSelectAll}
                        onClick={(event) => event.stopPropagation()}
                        aria-label="Select all visible requests"
                        className="w-4 h-4 rounded border-pf-line-strong text-pf-accent focus:ring-pf-accent"
                      />
                    </th>
                    <th className={`${cellClass} font-medium text-pf-secondary`}>Request #</th>
                    <th className={`${cellClass} font-medium text-pf-secondary`}>Dispensary</th>
                    <th className={`${cellClass} font-medium text-pf-secondary`}>Date</th>
                    <th className={`${cellClass} font-medium text-pf-secondary`}>Est. value</th>
                    <th className={`${cellClass} font-medium text-pf-secondary`}>Status</th>
                    <th className={`${cellClass} font-medium text-pf-secondary`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pf-line">
                  {visibleOrders.map((order) => {
                    const colors = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING;
                    return (
                      <tr
                        key={order.id}
                        onClick={() => router.push(`/grower/orders/${order.id}`)}
                        className={`cursor-pointer transition-colors hover:bg-pf-canvas ${selectedOrders.has(order.id) ? 'bg-pf-accent-bg/50' : ''}`}
                      >
                        <td className={cellClass}>
                          <input
                            type="checkbox"
                            checked={selectedOrders.has(order.id)}
                            onChange={() => toggleSelect(order.id)}
                            onClick={(event) => event.stopPropagation()}
                            aria-label={`Select request #${order.orderId}`}
                            className="w-4 h-4 rounded border-pf-line-strong text-pf-accent focus:ring-pf-accent"
                          />
                        </td>
                        <td className={cellClass}>
                          <div className="font-medium text-pf-text">#{order.orderId}</div>
                        </td>
                        <td className={`${cellClass} text-pf-muted`}>
                          {order.dispensary.businessName}
                        </td>
                        <td className={`${cellClass} text-pf-muted`}>
                          {format(new Date(order.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className={`${cellClass} font-bold text-pf-text`}>
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
        <div className="fixed inset-x-3 z-50 md:left-60 md:right-0 md:px-6" style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <div className="mx-auto max-w-4xl border border-pf-line-strong bg-pf-raised text-pf-text rounded-xl shadow-xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-3">
              <span className="font-medium">
                {selectedOrders.size} request{selectedOrders.size !== 1 ? 's' : ''} selected
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {allowedBulkTransitions.length > 0 ? (
                allowedBulkTransitions.map((targetStatus) => (
                  <button
                    key={targetStatus}
                    type="button"
                    onClick={() => handleBatchUpdate(targetStatus)}
                    disabled={isUpdating}
                    className={`min-h-10 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-raised ${ACTION_CLASSES[targetStatus]}`}
                  >
                    {ACTION_LABELS[targetStatus]}
                  </button>
                ))
              ) : (
                <span className="rounded-lg bg-pf-hover px-3 py-1.5 text-sm text-pf-secondary">
                  No bulk transitions available
                </span>
              )}
              <button
                type="button"
                onClick={() => setSelectedOrders(new Set())}
                disabled={isUpdating}
                className="min-h-10 rounded-lg px-3 py-1.5 text-sm font-medium text-pf-secondary transition-colors hover:text-pf-text disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-raised"
              >
                Clear selection
              </button>
            </div>

            {isUpdating && (
              <div className="flex items-center gap-2 text-sm text-pf-muted">
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
