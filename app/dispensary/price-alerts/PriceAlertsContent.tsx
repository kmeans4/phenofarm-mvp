'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useBuyerCollection } from '../hooks/useBuyerCollection';
import Link from "next/link";
import {
  Bell,
  Trash2,
  TrendingDown,
  Package,
  Loader2,
  Check,
  RefreshCw,
  BellOff
} from "lucide-react";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { Modal } from "@/app/components/ui/Modal";
import AddToCartButton from "../catalog/components/AddToCartButton";
import { ProductImage } from '@/app/components/ui/ProductImage';

interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  growerName: string;
  growerId: string;
  targetPrice: number;
  currentPrice: number | null;
  originalPrice?: number;
  inventoryQty?: number;
  discountPercent?: number;
  thc?: number | null;
  productType?: string | null;
  unit?: string | null;
  createdAt: string;
  isTriggered: boolean;
  triggeredAt?: string;
}

type AlertTab = 'active' | 'triggered' | 'history';

function normalizeAlerts(value: unknown): PriceAlert[] {
  if (!Array.isArray(value)) return [];
  return value.filter(item => item && typeof item === 'object' && typeof item.productId === 'string' && Number.isFinite(Number(item.targetPrice)) && Number(item.targetPrice) > 0)
    .map(item => ({ ...item, id: item.id || item.productId, productName: item.productName || 'Saved product', growerName: item.growerName || 'Grower', growerId: item.growerId || '',
      targetPrice: Number(item.targetPrice), currentPrice: item.currentPrice == null ? null : Number(item.currentPrice), createdAt: item.createdAt || new Date(0).toISOString(), isTriggered: item.isTriggered === true })).slice(0, 20);
}

interface PriceAlertsContentProps {
  embedded?: boolean;
}

export default function PriceAlertsContent({ embedded = false }: PriceAlertsContentProps) {
  const router = useRouter();
  const { items: alerts, setItems: setAlerts, ready, error: syncError, mergeRefresh } = useBuyerCollection('price-alerts', normalizeAlerts);
  const [refreshError, setRefreshError] = useState('');
  const [activeTab, setActiveTab] = useState<AlertTab>('active');
  const isLoading = !ready && !syncError && alerts.length === 0;
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const refreshPrices = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true; setRefreshing(true); setRefreshError('');
    try {
      const response = await fetch('/api/dispensary/price-alerts/refresh', { method: 'POST' });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.alerts) || normalizeAlerts(data.alerts).length !== data.alerts.length) throw new Error('Could not refresh prices. Your saved alerts have been kept.');
      mergeRefresh(data.alerts);
    } catch (error) { setRefreshError(error instanceof Error ? error.message : 'Could not refresh prices.'); }
    finally { refreshingRef.current = false; setRefreshing(false); }
  }, [mergeRefresh]);
  useEffect(() => { if (ready) void refreshPrices(); }, [ready, refreshPrices]);

  // Remove single alert
  const removeAlert = useCallback((alertId: string) => {
    setAlerts(prev => {
      const updated = prev.filter(a => a.id !== alertId);
      return updated;
    });
  }, [setAlerts]);

  // Clear all alerts for current tab
  const clearAllAlerts = useCallback(() => {
    setAlerts(prev => {
      const updated = prev.filter(a => {
        if (activeTab === 'active') return a.isTriggered;
        if (activeTab === 'triggered') return !a.isTriggered;
        return false;
      });
      return updated;
    });
    setShowClearConfirm(false);
  }, [activeTab, setAlerts]);

  // Mark triggered alert as seen
  const markAsSeen = useCallback((alertId: string) => {
    setAlerts(prev => {
      const updated = prev.map(a =>
        a.id === alertId ? { ...a, isTriggered: false, triggeredAt: undefined } : a
      );
      return updated;
    });
  }, [setAlerts]);

  // Filter alerts by tab
  const filteredAlerts = useMemo(() => alerts.filter(alert => {
    if (activeTab === 'active') return !alert.isTriggered;
    if (activeTab === 'triggered') return alert.isTriggered;
    return true;
  }).sort((a, b) => {
    if (a.isTriggered !== b.isTriggered) return a.isTriggered ? -1 : 1;
    const aDate = new Date(a.triggeredAt || a.createdAt).getTime();
    const bDate = new Date(b.triggeredAt || b.createdAt).getTime();
    return bDate - aDate;
  }), [activeTab, alerts]);

  const activeCount = alerts.filter(a => !a.isTriggered).length;
  const triggeredCount = alerts.filter(a => a.isTriggered).length;

  // Calculate savings stats
  const totalSavings = alerts
    .filter(a => a.isTriggered && a.originalPrice)
    .reduce((sum, a) => sum + ((a.originalPrice || 0) - (a.currentPrice ?? a.originalPrice ?? 0)), 0);
  const explainerText = 'Checks when you visit or refresh.';

  if (isLoading) {
    return (
      <div className={`${embedded ? 'min-h-48 rounded-xl border border-gray-200 bg-white' : 'min-h-screen bg-gray-50'} flex items-center justify-center`}>
        <div className="flex items-center gap-3 text-green-700">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-lg">Loading your price alerts...</span>
        </div>
      </div>
    );
  }

  const clearAllButton = alerts.length > 0 ? (
    <button
      aria-label="Clear alerts"
      onClick={() => setShowClearConfirm(true)}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 sm:w-auto"
    >
      <Trash2 size={18} />
      <span>Clear alerts</span>
    </button>
  ) : undefined;

  const tabs = (
    <div className="flex gap-1 overflow-x-auto">
      {(['active', 'triggered', 'history'] as AlertTab[]).map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`relative px-4 py-3 text-sm font-medium border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 ${
            activeTab === tab
              ? 'border-green-600 text-green-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab === 'history' ? 'All' : tab === 'active' ? `Active (${activeCount})` : `Triggered (${triggeredCount})`}
        </button>
      ))}
    </div>
  );

  const alertToolbar = (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gray-500">{explainerText}</p>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Refresh prices" onClick={refreshPrices} disabled={refreshing} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-green-700 disabled:opacity-50"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />{refreshing ? 'Refreshing…' : 'Refresh'}</button>
          {alerts.length > 0 && <details className="relative"><summary className="flex min-h-10 cursor-pointer items-center px-2 text-sm text-gray-600">More</summary><div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border bg-white p-1 shadow-lg">{clearAllButton}</div></details>}
        </div>
      </div>
      {tabs}
      {totalSavings > 0 && <p className="mt-2 text-xs text-green-700">Tracked price decrease: ${totalSavings.toFixed(2)}</p>}
    </div>
  );

  return (
    <div className={embedded ? "pb-4" : "space-y-4 sm:space-y-6 pb-20 sm:pb-24"}>
      {(syncError || refreshError) && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{syncError || refreshError}</p>}
      {!embedded && <PageHeader title="Price alerts" actions={<Link href="/dispensary/catalog" className="text-sm text-green-700">Browse catalog</Link>} />}
      {alertToolbar}

      {/* Content */}
      <div className={embedded ? "py-4" : ""}>
        {filteredAlerts.length === 0 ? (
          <EmptyState
            type={activeTab}
            onBrowse={() => activeTab === 'triggered' ? setActiveTab('active') : router.push('/dispensary/catalog')}
          />
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onRemove={() => removeAlert(alert.id)}
                onMarkSeen={() => markAsSeen(alert.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <Modal open onClose={() => setShowClearConfirm(false)} title="Clear alerts?">
            <p className="text-gray-600 mb-6">
              This will remove all {activeTab === 'active' ? 'active' : activeTab === 'triggered' ? 'triggered' : ''} price alerts.
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={clearAllAlerts}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
              >
                Clear All
              </button>
            </div>
        </Modal>
      )}
    </div>
  );
}

// Alert Card Component
function AlertCard({
  alert,
  onRemove,
  onMarkSeen
}: {
  alert: PriceAlert;
  onRemove: () => void;
  onMarkSeen: () => void;
}) {
  const priceDrop = alert.originalPrice ? alert.originalPrice - (alert.currentPrice ?? alert.originalPrice) : 0;
  const discountPercent = alert.discountPercent ||
    (alert.originalPrice ? Math.round((priceDrop / alert.originalPrice) * 100) : 0);
  const unitLabel = alert.unit?.toLowerCase() === 'gram' ? 'g' : alert.unit || 'unit';
  const inventoryQty = alert.inventoryQty ?? 0;

  return (
    <div className={`overflow-hidden rounded-xl border bg-white transition-all hover:shadow-md ${
      alert.isTriggered ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-gray-200'
    }`}>
      {alert.isTriggered && (
        <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-800 sm:px-6">
          <TrendingDown size={18} />
          <span className="text-sm font-semibold">Price dropped</span>
          <span className="text-sm text-emerald-700">
            Current price is at or below your ${alert.targetPrice.toFixed(2)} target.
          </span>
        </div>
      )}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 sm:flex sm:gap-4">
          {/* Product Image */}
          <Link href={`/dispensary/grower/${alert.growerId}`} className="flex-shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2">
            <ProductImage src={alert.productImage} alt={alert.productName} productType={alert.productType} className="h-14 w-14 rounded-lg sm:h-24 sm:w-24" />
          </Link>

          {/* Product Info */}
          <div className="contents sm:block sm:flex-1 sm:min-w-0">
            <div className="contents sm:flex sm:items-start sm:justify-between sm:gap-2">
              <div>
                <h3 className="break-words text-sm font-semibold text-gray-900 sm:text-lg">{alert.productName}</h3>
                <p className="text-sm text-gray-500">
                  by <Link href={`/dispensary/grower/${alert.growerId}`} className="inline-flex min-h-10 items-center rounded-sm text-green-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2">
                    {alert.growerName}
                  </Link>
                </p>

                <div className="flex flex-wrap gap-2 mt-2">
                  {alert.thc != null && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      THC {alert.thc}%
                    </span>
                  )}
                  {alert.productType && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {alert.productType}
                    </span>
                  )}

                </div>
              </div>

              {/* Price Info */}
              <div className="col-span-2 grid min-w-0 grid-cols-2 gap-2 text-left sm:min-w-[220px] sm:text-right">
                <div className={`rounded-lg border px-3 py-2 ${
                  alert.isTriggered ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Current</p>
                  <p className={`text-xl font-bold ${alert.isTriggered ? 'text-emerald-700' : 'text-gray-900'}`}>
                    {alert.currentPrice == null ? 'Request pricing' : <>${alert.currentPrice.toFixed(2)}<span className="text-xs font-normal text-gray-500">/{unitLabel}</span></>}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Target</p>
                  <p className="text-xl font-bold text-gray-900">${alert.targetPrice.toFixed(2)}<span className="text-xs font-normal text-gray-500">/{unitLabel}</span></p>
                </div>
              </div>
            </div>

            {alert.isTriggered && discountPercent > 0 && (
              <div className="col-span-2 mt-1 inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-orange-700">
                <TrendingDown size={14} />
                <span className="text-sm font-semibold">{discountPercent}% below original tracked price</span>
              </div>
            )}

            {/* Alert Status */}
            <div className="col-span-2 flex flex-wrap items-center gap-3 sm:mt-4">
              {/* Actions */}
              <div className="ml-auto flex items-center gap-2">
                {alert.isTriggered && (
                  <AddToCartButton
                    product={{
                      id: alert.productId,
                      name: alert.productName,
                      price: alert.currentPrice,
                      strain: null,
                      unit: alert.unit || null,
                      thc: alert.thc ?? null,
                      inventoryQty,
                    }}
                    growerName={alert.growerName}
                    growerId={alert.growerId}
                    compact
                    compactLabel="Add to draft"
                  />
                )}

                {alert.isTriggered && (
                  <button
                    onClick={onMarkSeen}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                    title="Mark as seen" aria-label="Mark alert as seen"
                  >
                    <Check size={18} />
                  </button>
                )}

                <button
                  onClick={onRemove}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                  title="Remove alert" aria-label="Remove alert"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Triggered Info */}
            {alert.isTriggered && alert.triggeredAt && (
              <p className="col-span-2 mt-2 text-xs text-gray-500">
                Price drop detected on {new Date(alert.triggeredAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ type, onBrowse }: { type: AlertTab; onBrowse: () => void }) {
  const configs = {
    active: {
      icon: BellOff,
      title: 'No Active Price Alerts',
      description: 'Track a target price from the catalog.',
      action: 'Browse Catalog'
    },
    triggered: {
      icon: Bell,
      title: 'No price drops yet',
      description: 'Targets are checked when you visit or refresh.',
      action: 'View Active Alerts'
    },
    history: {
      icon: TrendingDown,
      title: 'No saved alerts',
      description: 'Track a target price from the catalog.',
      action: 'Browse Catalog'
    }
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <Icon className="text-gray-400" size={32} />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{config.title}</h3>
      <p className="text-gray-500 max-w-md mx-auto mb-3">{config.description}</p>
      <button
        onClick={onBrowse}
        className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
      >
        <Package size={18} />
        {config.action}
      </button>
    </div>
  );
}
