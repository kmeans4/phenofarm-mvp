'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { refreshSessionPriceAlerts } from '../refresh-price-alerts';
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
  const userId = useSession().data?.user?.id;
  const { items: alerts, setItems: setAlerts, ready, error: syncError, mergeRefresh } = useBuyerCollection('price-alerts', normalizeAlerts);
  const [refreshError, setRefreshError] = useState('');
  const [activeTab, setActiveTab] = useState<AlertTab>('active');
  const isLoading = !ready && !syncError && alerts.length === 0;
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const refreshPrices = useCallback(async (force = false) => {
    if (refreshingRef.current || !userId) return;
    refreshingRef.current = true; setRefreshing(true); setRefreshError('');
    try {
      const data = await refreshSessionPriceAlerts(userId, force);
      if (data) mergeRefresh(normalizeAlerts(data));
    } catch (error) { setRefreshError(error instanceof Error ? error.message : 'Could not refresh prices.'); }
    finally { refreshingRef.current = false; setRefreshing(false); }
  }, [mergeRefresh, userId]);
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
      <div className={`${embedded ? 'min-h-48 rounded-xl border border-pf-line bg-pf-surface' : 'min-h-48 rounded-xl border border-pf-line bg-pf-surface'} flex items-center justify-center`}>
        <div className="flex items-center gap-3 text-pf-accent">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-sm">Loading alerts…</span>
        </div>
      </div>
    );
  }

  const clearAllButton = alerts.length > 0 ? (
    <button
      aria-label="Clear alerts"
      onClick={() => setShowClearConfirm(true)}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-pf-danger transition-colors hover:bg-pf-danger-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas sm:w-auto"
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
          className={`relative px-4 py-3 text-sm font-medium border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas ${
            activeTab === tab
              ? 'border-emerald-500 text-pf-accent'
              : 'border-transparent text-pf-muted hover:text-pf-secondary'
          }`}
        >
          {tab === 'history' ? 'All' : tab === 'active' ? `Active (${activeCount})` : `Triggered (${triggeredCount})`}
        </button>
      ))}
    </div>
  );

  const alertToolbar = (
    <div className="rounded-xl border border-pf-line bg-pf-surface p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-pf-muted">{explainerText}</p>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Refresh prices" onClick={() => void refreshPrices(true)} disabled={refreshing} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-pf-accent disabled:opacity-50"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />{refreshing ? 'Refreshing…' : 'Refresh'}</button>
          {alerts.length > 0 && <details className="relative"><summary className="flex min-h-10 cursor-pointer items-center px-2 text-sm text-pf-muted">More</summary><div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-pf-line bg-pf-surface p-1 shadow-lg">{clearAllButton}</div></details>}
        </div>
      </div>
      {tabs}
      {totalSavings > 0 && <p className="mt-2 text-xs text-pf-accent">Tracked price decrease: ${totalSavings.toFixed(2)}</p>}
    </div>
  );

  return (
    <div className={embedded ? "pb-4" : "space-y-4"}>
      {(syncError || refreshError) && <p role="alert" className="rounded-lg bg-pf-danger-bg p-3 text-pf-danger">{syncError || refreshError}</p>}
      {!embedded && <PageHeader title="Price alerts" actions={<Link href="/dispensary/catalog" className="text-sm text-pf-accent">Browse catalog</Link>} />}
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
            <p className="text-pf-muted mb-6">
              This will remove all {activeTab === 'active' ? 'active' : activeTab === 'triggered' ? 'triggered' : ''} price alerts.
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 border border-pf-line-strong rounded-lg text-pf-secondary hover:bg-pf-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
              >
                Cancel
              </button>
              <button
                onClick={clearAllAlerts}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
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
    <div className={`overflow-hidden rounded-xl border bg-pf-surface transition-colors hover:border-pf-line-strong ${
      alert.isTriggered ? 'border-pf-accent-line ring-1 ring-pf-accent-line' : 'border-pf-line'
    }`}>
      {alert.isTriggered && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-pf-accent-line bg-pf-accent-bg px-4 py-2 text-pf-accent">
          <TrendingDown size={18} />
          <span className="text-sm font-semibold">Price dropped</span>
          <span className="text-sm text-pf-accent">
            At or below your ${alert.targetPrice.toFixed(2)} target.
          </span>
        </div>
      )}
      <div className="p-3 sm:p-4">
        <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 sm:flex sm:gap-4">
          {/* Product Image */}
          <Link href={`/dispensary/grower/${alert.growerId}`} className="flex-shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas">
            <ProductImage src={alert.productImage} alt={alert.productName} productType={alert.productType} className="h-14 w-14 rounded-lg sm:h-16 sm:w-16" />
          </Link>

          {/* Product Info */}
          <div className="contents sm:block sm:flex-1 sm:min-w-0">
            <div className="contents sm:flex sm:items-start sm:justify-between sm:gap-2">
              <div>
                <h3 className="break-words text-sm font-semibold text-pf-text sm:text-base">{alert.productName}</h3>
                <p className="text-sm text-pf-muted">
                  by <Link href={`/dispensary/grower/${alert.growerId}`} className="inline-flex min-h-10 items-center rounded-sm text-pf-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas">
                    {alert.growerName}
                  </Link>
                </p>

                <div className="flex flex-wrap gap-2 mt-2">
                  {alert.thc != null && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-pf-accent-bg text-pf-accent">
                      THC {alert.thc}%
                    </span>
                  )}
                  {alert.productType && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-pf-raised text-pf-secondary">
                      {alert.productType}
                    </span>
                  )}

                </div>
              </div>

              {/* Price Info */}
              <div className="col-span-2 grid min-w-0 grid-cols-2 gap-2 text-left sm:min-w-[220px] sm:text-right">
                <div className={`rounded-lg border px-3 py-2 ${
                  alert.isTriggered ? 'border-pf-accent-line bg-pf-accent-bg' : 'border-pf-line bg-pf-canvas'
                }`}>
                  <p className="text-xs font-medium uppercase tracking-wide text-pf-muted">Current</p>
                  <p className={`text-lg font-semibold ${alert.isTriggered ? 'text-pf-accent' : 'text-pf-text'}`}>
                    {alert.currentPrice == null ? 'Request pricing' : <>${alert.currentPrice.toFixed(2)}<span className="text-xs font-normal text-pf-muted">/{unitLabel}</span></>}
                  </p>
                </div>
                <div className="rounded-lg border border-pf-line bg-pf-surface px-3 py-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-pf-muted">Target</p>
                  <p className="text-lg font-semibold text-pf-text">${alert.targetPrice.toFixed(2)}<span className="text-xs font-normal text-pf-muted">/{unitLabel}</span></p>
                </div>
              </div>
            </div>

            {alert.isTriggered && discountPercent > 0 && (
              <div className="col-span-2 mt-1 inline-flex items-center gap-1 rounded-full bg-pf-warning-bg px-2.5 py-1 text-pf-warning">
                <TrendingDown size={14} />
                <span className="text-sm font-semibold">{discountPercent}% below original price</span>
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
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-pf-muted hover:text-pf-accent hover:bg-pf-accent-bg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
                    title="Mark as seen" aria-label="Mark alert as seen"
                  >
                    <Check size={18} />
                  </button>
                )}

                <button
                  onClick={onRemove}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-pf-muted hover:text-pf-danger hover:bg-pf-danger-bg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
                  title="Remove alert" aria-label="Remove alert"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Triggered Info */}
            {alert.isTriggered && alert.triggeredAt && (
              <p className="col-span-2 mt-2 text-xs text-pf-muted">
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
      title: 'No active alerts',
      description: 'Track a target price from the catalog.',
      action: 'Browse catalog'
    },
    triggered: {
      icon: Bell,
      title: 'No price drops yet',
      description: 'Targets are checked when you visit or refresh.',
      action: 'View active alerts'
    },
    history: {
      icon: TrendingDown,
      title: 'No saved alerts',
      description: 'Track a target price from the catalog.',
      action: 'Browse catalog'
    }
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 bg-pf-surface rounded-full flex items-center justify-center mx-auto mb-3">
        <Icon className="text-pf-muted" size={32} />
      </div>
      <h3 className="text-base font-semibold text-pf-text mb-2">{config.title}</h3>
      <p className="mx-auto mb-3 max-w-sm text-sm text-pf-muted">{config.description}</p>
      <button
        onClick={onBrowse}
        className="inline-flex items-center gap-2 min-h-10 px-4 py-2 bg-emerald-500 text-[#032116] rounded-lg hover:bg-emerald-400 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
      >
        <Package size={18} />
        {config.action}
      </button>
    </div>
  );
}
