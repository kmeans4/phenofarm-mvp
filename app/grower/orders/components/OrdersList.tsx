'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import {
  readDensityPreference,
  saveDensityPreference,
  TableDensity,
  TableDensityControl,
} from '@/app/components/ux/TableDensityControl';
import { getOrderStatusLabel } from '@/lib/order-workflow';

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
}

type OrderWorkflowView = 'all' | 'needs-review' | 'accepted' | 'preparing' | 'ready' | 'delivered';

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

export default function OrdersList({ initialOrders }: OrdersListProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [workflowView, setWorkflowView] = useState<OrderWorkflowView>('all');
  const [tableDensity, setTableDensity] = useState<TableDensity>('comfortable');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTableDensity(readDensityPreference('phenofarm:density:grower-orders'));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

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
      { key: 'delivered' as const, label: 'Delivered', count: orders.filter((order) => order.status === 'DELIVERED').length },
    ],
    [orders],
  );

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

  const handleBatchUpdate = async (newStatus: string) => {
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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update requests');
      }

      const result = await response.json();
      
      // Update local state
      setOrders(prev => prev.map(order => 
        selectedOrders.has(order.id) ? { ...order, status: newStatus } : order
      ));
      
      setMessage({ 
        type: 'success', 
        text: `Updated ${result.updatedCount} request${result.updatedCount !== 1 ? 's' : ''} to ${STATUS_LABELS[newStatus]}` 
      });
      setSelectedOrders(new Set());
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Update failed' 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const canCancel = Array.from(selectedOrders).some(id => {
    const order = orders.find(o => o.id === id);
    return order && order.status !== 'DELIVERED' && order.status !== 'CANCELLED';
  });

  const hasSelection = selectedOrders.size > 0;
  const compactMode = tableDensity === 'compact';
  const cellClass = compactMode ? 'px-3 sm:px-4 py-1.5 text-xs' : 'px-3 sm:px-4 py-2 sm:py-3 text-sm';

  return (
    <div className="relative">
      {/* Message Toast */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          <div className="flex items-center justify-between">
            <span className="font-medium">{message.text}</span>
            <button 
              onClick={() => setMessage(null)}
              className="text-sm opacity-75 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-gray-900">Saved workflow views</p>
          <p className="text-xs text-gray-500">Start with the next request state before selecting batch actions.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {workflowViews.map((view) => (
            <button
              key={view.key}
              type="button"
              onClick={() => setWorkflowView(view.key)}
              aria-pressed={workflowView === view.key}
              aria-label={`${view.label}: ${view.count} requests`}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                workflowView === view.key
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {view.label}
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Active Requests ({visibleOrders.length})
            </CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <TableDensityControl value={tableDensity} onChange={handleDensityChange} />
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
                {orders.length === 0 ? 'No active order requests' : 'No requests in this view'}
              </h3>
              <p className="text-gray-500 mb-2 max-w-md mx-auto">
                {orders.length === 0
                  ? 'You do not have any submitted, accepted, preparing, or ready/in-transit requests right now.'
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
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className={cellClass}>
                      <input
                        type="checkbox"
                        checked={visibleOrders.length > 0 && visibleOrders.every((order) => selectedOrders.has(order.id))}
                        onChange={toggleSelectAll}
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
                        className={`hover:bg-gray-50 transition-colors ${selectedOrders.has(order.id) ? 'bg-green-50/50' : ''}`}
                      >
                        <td className={cellClass}>
                          <input
                            type="checkbox"
                            checked={selectedOrders.has(order.id)}
                            onChange={() => toggleSelect(order.id)}
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
                            <Link href={`/grower/orders/${order.id}`}>
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
                onClick={() => setSelectedOrders(new Set())}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => handleBatchUpdate('CONFIRMED')}
                disabled={isUpdating}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => handleBatchUpdate('PROCESSING')}
                disabled={isUpdating}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
              >
                Prepare
              </button>
              <button
                onClick={() => handleBatchUpdate('SHIPPED')}
                disabled={isUpdating}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
              >
                Ready / In transit
              </button>
              <button
                onClick={() => handleBatchUpdate('DELIVERED')}
                disabled={isUpdating}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
              >
                Deliver
              </button>
              {canCancel && (
                <button
                  onClick={() => handleBatchUpdate('CANCELLED')}
                  disabled={isUpdating}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              )}
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
