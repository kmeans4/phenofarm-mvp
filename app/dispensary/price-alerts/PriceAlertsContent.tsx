'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useBuyerCollection } from '../hooks/useBuyerCollection';
import { refreshSessionPriceAlerts } from '../refresh-price-alerts';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { ProductImage } from '@/app/components/ui/ProductImage';
import { Modal } from '@/app/components/ui/Modal';
import { toast } from '@/app/hooks/useToast';
import { formatMoney } from '@/lib/format';
import { formatProductUnit } from '@/lib/product-display';
import AddToCartButton from '../catalog/components/AddToCartButton';
interface Alert {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  growerName: string;
  growerId: string;
  targetPrice: number;
  currentPrice: number | null;
  inventoryQty?: number;
  thc?: number | null;
  productType?: string | null;
  unit?: string | null;
  createdAt: string;
  isTriggered: boolean;
  triggeredAt?: string;
}
function normalizeAlerts(value: unknown): Alert[] {
  return Array.isArray(value)
    ? value
        .filter(
          (item) =>
            item &&
            typeof item.productId === 'string' &&
            Number(item.targetPrice) > 0
        )
        .map((item) => ({
          ...item,
          id: item.id || item.productId,
          targetPrice: Number(item.targetPrice),
          currentPrice:
            item.currentPrice == null ? null : Number(item.currentPrice),
          isTriggered: item.isTriggered === true,
        }))
    : [];
}
export default function PriceAlertsContent({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const userId = useSession().data?.user?.id;
  const {
    items: alerts,
    setItems,
    ready,
    error,
    retry,
    mergeRefresh,
  } = useBuyerCollection('price-alerts', normalizeAlerts);
  const [refreshing, setRefreshing] = useState(false);
  const busy = useRef(false);
  const [refreshError, setRefreshError] = useState('');
  const [editing, setEditing] = useState<Alert | null>(null);
  const [target, setTarget] = useState('');
  const [targetError, setTargetError] = useState('');
  const refresh = useCallback(
    async (force = false) => {
      if (!userId || busy.current) return;
      busy.current = true;
      setRefreshing(true);
      setRefreshError('');
      try {
        const data = await refreshSessionPriceAlerts(userId, force);
        if (data) mergeRefresh(data);
      } catch {
        setRefreshError(
          'Could not refresh prices. Retry when your connection is back.'
        );
      } finally {
        setRefreshing(false);
        busy.current = false;
      }
    },
    [mergeRefresh, userId]
  );
  useEffect(() => {
    if (ready) void refresh();
  }, [ready, refresh]);
  function remove(values: Alert[]) {
    const ids = new Set(values.map((value) => value.id));
    setItems((current) => current.filter((value) => !ids.has(value.id)));
    toast.success(values.length === 1 ? 'Alert removed' : 'Alerts cleared', {
      action: {
        label: 'Undo',
        onClick: () =>
          setItems((current) => [
            ...current,
            ...values.filter(
              (value) =>
                !current.some((item) => item.productId === value.productId)
            ),
          ]),
      },
    });
  }
  if (!ready && !error)
    return (
      <p role="status" className="p-4 text-sm">
        Loading alerts…
      </p>
    );
  return (
    <div className="space-y-3">
      {!embedded && <PageHeader title="Price alerts" />}
      {(error || refreshError) && (
        <p
          role="alert"
          className="rounded-lg bg-pf-danger-bg p-3 text-sm text-pf-danger"
        >
          {error || refreshError}
          <button
            onClick={() => {
              retry();
              void refresh(true);
            }}
            className="ml-3 min-h-11 underline"
          >
            Retry
          </button>
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-pf-muted">
          {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'}
        </p>
        <div className="flex gap-2">
          <button
            aria-label="Refresh prices"
            onClick={() => void refresh(true)}
            disabled={refreshing}
            className="flex min-h-11 items-center gap-2 px-3 text-sm text-pf-accent"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
          {alerts.length > 0 && (
            <button
              onClick={() => remove(alerts)}
              className="min-h-11 px-3 text-sm text-pf-danger"
            >
              Clear alerts
            </button>
          )}
        </div>
      </div>
      {!alerts.length && !error ? (
        <section className="rounded-xl border border-pf-line bg-pf-surface p-6 text-center">
          <h2 className="font-semibold">No price alerts</h2>
          <Link
            href="/dispensary/catalog"
            className="inline-flex min-h-11 items-center text-pf-accent"
          >
            Browse catalog
          </Link>
        </section>
      ) : (
        [...alerts]
          .sort(
            (a, b) =>
              Number(b.isTriggered) - Number(a.isTriggered) ||
              Date.parse(b.createdAt) - Date.parse(a.createdAt)
          )
          .map((alert) => (
            <article
              key={alert.id}
              className={`space-y-3 rounded-xl border bg-pf-surface p-3 sm:p-4 ${alert.isTriggered ? 'border-pf-accent-line' : 'border-pf-line'}`}
            >
              {alert.isTriggered && (
                <p className="font-semibold text-pf-accent">Price dropped</p>
              )}
              <div className="flex gap-3">
                <Link href={`/dispensary/catalog?product=${alert.productId}`}>
                  <ProductImage
                    src={alert.productImage}
                    alt={alert.productName}
                    productType={alert.productType}
                    className="h-16 w-16 shrink-0 rounded-lg"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dispensary/catalog?product=${alert.productId}`}
                    className="break-words font-semibold hover:underline"
                  >
                    {alert.productName}
                  </Link>
                  <p className="text-sm text-pf-muted">{alert.growerName}</p>
                  <p className="mt-1 text-sm">
                    {alert.currentPrice == null
                      ? 'Price on request'
                      : `${formatMoney(alert.currentPrice)} / ${formatProductUnit(alert.unit)}`}
                    <span className="ml-2 text-pf-muted">
                      Target {formatMoney(alert.targetPrice)}
                    </span>
                  </p>
                </div>
                <button
                  aria-label={`Remove alert for ${alert.productName}`}
                  onClick={() => remove([alert])}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-pf-danger"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  className="min-h-11 rounded-lg border border-pf-line-strong px-3 text-sm"
                  onClick={() => {
                    setEditing(alert);
                    setTarget(String(alert.targetPrice));
                    setTargetError('');
                  }}
                >
                  Edit target
                </button>
                {alert.isTriggered && (
                  <button
                    className="min-h-11 px-3 text-sm text-pf-accent"
                    onClick={() =>
                      setItems((current) =>
                        current.map((value) =>
                          value.id === alert.id
                            ? {
                                ...value,
                                isTriggered: false,
                                triggeredAt: undefined,
                              }
                            : value
                        )
                      )
                    }
                  >
                    Dismiss
                  </button>
                )}
                {alert.currentPrice != null && (
                  <AddToCartButton
                    product={{
                      id: alert.productId,
                      name: alert.productName,
                      price: alert.currentPrice,
                      inventoryQty: alert.inventoryQty || 0,
                      strain: null,
                      unit: alert.unit || null,
                      thc: alert.thc ?? null,
                      images: alert.productImage ? [alert.productImage] : [],
                      productType: alert.productType,
                    }}
                    growerName={alert.growerName}
                    growerId={alert.growerId}
                    compact
                  />
                )}
              </div>
            </article>
          ))
      )}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit price alert"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const price = Number(target.replace(/[$,\s]/g, ''));
            if (!Number.isFinite(price) || price <= 0) {
              setTargetError('Enter a price above zero.');
              return;
            }
            setItems((current) =>
              current.map((alert) =>
                alert.productId === editing?.productId
                  ? { ...alert, targetPrice: price, isTriggered: false }
                  : alert
              )
            );
            setEditing(null);
          }}
          className="space-y-3"
        >
          <label className="block text-sm">
            Target price
            <input
              type="text"
              inputMode="decimal"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              aria-invalid={!!targetError}
              className="mt-1 min-h-11 w-full rounded-lg border border-pf-line-strong bg-pf-surface px-3 text-base"
              autoFocus
            />
          </label>
          {targetError && (
            <p role="alert" className="text-sm text-pf-danger">
              {targetError}
            </p>
          )}
          <button className="min-h-11 rounded-lg bg-emerald-500 px-4 font-semibold text-[#032116]">
            Save alert
          </button>
        </form>
      </Modal>
    </div>
  );
}
