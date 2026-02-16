'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from "next/link";
import { 
  Bell, 
  ArrowLeft, 
  Trash2, 
  TrendingDown, 
  Package, 
  Loader2,
  Check,
  AlertCircle,
  RefreshCw,
  DollarSign,
  BellRing,
  BellOff
} from "lucide-react";

interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  growerName: string;
  growerId: string;
  targetPrice: number;
  currentPrice: number;
  originalPrice?: number;
  discountPercent?: number;
  thc?: number | null;
  productType?: string | null;
  unit?: string | null;
  createdAt: string;
  isTriggered: boolean;
  triggeredAt?: string;
}

type AlertTab = 'active' | 'triggered' | 'history';

const PRICE_ALERTS_KEY = 'phenofarm_price_alerts';
const MAX_ALERTS = 20;

export default function PriceAlertsContent() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [activeTab, setActiveTab] = useState<AlertTab>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load alerts from localStorage
  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = () => {
    try {
      const stored = localStorage.getItem(PRICE_ALERTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setAlerts(parsed);
      }
    } catch (e) {
      console.error('Failed to load price alerts:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh current prices
  const refreshPrices = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/dispensary/price-alerts/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alerts }),
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts);
        localStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(data.alerts));
      }
    } catch (error) {
      console.error('Failed to refresh prices:', error);
    } finally {
      setRefreshing(false);
    }
  }, [alerts]);

  // Remove single alert
  const removeAlert = useCallback((alertId: string) => {
    setAlerts(prev => {
      const updated = prev.filter(a => a.id !== alertId);
      localStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Clear all alerts for current tab
  const clearAllAlerts = useCallback(() => {
    setAlerts(prev => {
      const updated = prev.filter(a => {
        if (activeTab === 'active') return a.isTriggered;
        if (activeTab === 'triggered') return !a.isTriggered;
        return true; // history - clear all
      });
      localStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(updated));
      return updated;
    });
    setShowClearConfirm(false);
  }, [activeTab]);

  // Mark triggered alert as seen
  const markAsSeen = useCallback((alertId: string) => {
    setAlerts(prev => {
      const updated = prev.map(a => 
        a.id === alertId ? { ...a, isTriggered: false, triggeredAt: undefined } : a
      );
      localStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Filter alerts by tab
  const filteredAlerts = alerts.filter(alert => {
    if (activeTab === 'active') return !alert.isTriggered;
    if (activeTab === 'triggered') return alert.isTriggered;
    return true;
  });

  const activeCount = alerts.filter(a => !a.isTriggered).length;
  const triggeredCount = alerts.filter(a => a.isTriggered).length;

  // Calculate savings stats
  const totalSavings = alerts
    .filter(a => a.isTriggered && a.originalPrice)
    .reduce((sum, a) => sum + ((a.originalPrice || 0) - a.currentPrice), 0);

  const triggeredAlerts = alerts.filter(a => a.isTriggered);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-green-700">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-lg">Loading your price alerts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/dispensary/catalog"
                className="flex items-center gap-2 text-gray-600 hover:text-green-700 transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="hidden sm:inline">Back to Catalog</span>
              </Link>
              <div className="h-6 w-px bg-gray-300 hidden sm:block" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Bell className="text-green-700" size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Price Alerts</h1>
                  <p className="text-sm text-gray-500 hidden sm:block">
                    {activeCount} active, {triggeredCount} triggered
                  </p>
                </div>
              </div>
            </div>
            
            {alerts.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        {alerts.length > 0 && (
          <div className="border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <BellRing className="text-green-600" size={16} />
                  <span className="text-gray-600">
                    <span className="font-semibold text-gray-900">{activeCount}</span> Active Alerts
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="text-orange-600" size={16} />
                  <span className="text-gray-600">
                    <span className="font-semibold text-gray-900">{triggeredCount}</span> Price Drops
                  </span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="text-green-600" size={16} />
                    <span className="text-gray-600">
                      <span className="font-semibold text-green-700">${totalSavings.toFixed(2)}</span> Total Savings
                    </span>
                  </div>
                )}
                <button
                  onClick={refreshPrices}
                  disabled={refreshing}
                  className="flex items-center gap-2 ml-auto text-green-700 hover:text-green-800"
                >
                  <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh Prices'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-1">
              {(['active', 'triggered', 'history'] as AlertTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors relative ${
                    activeTab === tab
                      ? 'border-green-600 text-green-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'active' && activeCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                      {activeCount}
                    </span>
                  )}
                  {tab === 'triggered' && triggeredCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                      {triggeredCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredAlerts.length === 0 ? (
          <EmptyState 
            type={activeTab} 
            onBrowse={() => window.location.href = '/dispensary/catalog'} 
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle size={24} />
              <h3 className="text-lg font-semibold">Clear All Alerts?</h3>
            </div>
            <p className="text-gray-600 mb-6">
              This will remove all {activeTab === 'active' ? 'active' : activeTab === 'triggered' ? 'triggered' : ''} price alerts. 
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={clearAllAlerts}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
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
  const priceDrop = alert.originalPrice ? alert.originalPrice - alert.currentPrice : 0;
  const discountPercent = alert.discountPercent || 
    (alert.originalPrice ? Math.round((priceDrop / alert.originalPrice) * 100) : 0);

  return (
    <div className={`bg-white rounded-xl border p-4 sm:p-6 transition-all hover:shadow-md ${
      alert.isTriggered ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'
    }`}>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Product Image */}
        <Link href={`/dispensary/grower/${alert.growerId}`} className="flex-shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center overflow-hidden">
            {alert.productImage ? (
              <img 
                src={alert.productImage} 
                alt={alert.productName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="text-green-300" size={32} />
            )}
          </div>
        </Link>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{alert.productName}</h3>
              <p className="text-sm text-gray-500">
                by <Link href={`/dispensary/grower/${alert.growerId}`} className="text-green-600 hover:underline">
                  {alert.growerName}
                </Link>
              </p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {alert.thc && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    THC {alert.thc}%
                  </span>
                )}
                {alert.productType && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {alert.productType}
                  </span>
                )}
                {alert.unit && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {alert.unit}
                  </span>
                )}
              </div>
            </div>

            {/* Price Info */}
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                {alert.isTriggered ? (
                  <>
                    <span className="text-sm text-gray-500 line-through">
                      ${alert.targetPrice.toFixed(2)}
                    </span>
                    <span className="text-2xl font-bold text-green-700">
                      ${alert.currentPrice.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-gray-900">
                    ${alert.currentPrice.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">/ {alert.unit || 'unit'}</div>
              
              {alert.isTriggered && discountPercent > 0 && (
                <div className="flex items-center gap-1 mt-1 text-orange-600">
                  <TrendingDown size={14} />
                  <span className="font-semibold text-sm">{discountPercent}% off</span>
                </div>
              )}
            </div>
          </div>

          {/* Alert Status */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {alert.isTriggered ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg">
                <BellRing size={16} />
                <span className="font-medium text-sm">Price dropped below ${alert.targetPrice.toFixed(2)}!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg">
                <Bell size={16} />
                <span className="font-medium text-sm">Alert at ${alert.targetPrice.toFixed(2)}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 ml-auto">
              {alert.isTriggered && (
                <Link
                  href={`/dispensary/catalog?search=${encodeURIComponent(alert.productName)}`}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <Check size={16} />
                  Buy Now
                </Link>
              )}
              
              {alert.isTriggered && (
                <button
                  onClick={onMarkSeen}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Mark as seen"
                >
                  <Check size={18} />
                </button>
              )}
              
              <button
                onClick={onRemove}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove alert"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* Triggered Info */}
          {alert.isTriggered && alert.triggeredAt && (
            <p className="mt-2 text-xs text-gray-500">
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
  );
}

// Empty State Component
function EmptyState({ type, onBrowse }: { type: AlertTab; onBrowse: () => void }) {
  const configs = {
    active: {
      icon: BellOff,
      title: 'No Active Price Alerts',
      description: 'You haven\'t set any price alerts yet. Browse the catalog and click the bell icon on any product to get notified when the price drops.',
      action: 'Browse Catalog'
    },
    triggered: {
      icon: Bell,
      title: 'No Triggered Alerts',
      description: 'No products have dropped below your target prices yet. Check back later or set more alerts!',
      action: 'View Active Alerts'
    },
    history: {
      icon: TrendingDown,
      title: 'No Alert History',
      description: 'Your price alert history will appear here once you start using the feature.',
      action: 'Browse Catalog'
    }
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon className="text-gray-400" size={32} />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{config.title}</h3>
      <p className="text-gray-500 max-w-md mx-auto mb-6">{config.description}</p>
      <button
        onClick={onBrowse}
        className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
      >
        <Package size={18} />
        {config.action}
      </button>
    </div>
  );
}
