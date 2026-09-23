'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import FavoritesContent from '../favorites/FavoritesContent';
import PriceAlertsContent from '../price-alerts/PriceAlertsContent';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { pluralize } from '@/lib/utils';

interface RecentProduct {
  productId: string;
  name: string;
  growerName: string;
  growerId: string;
  unit: string | null;
  price: number;
  lastOrderedAt: string;
  orderCount: number;
}

interface SavedContentProps {
  initialTab: SavedTab;
  counts: Record<SavedTab, number>;
  recentProducts: RecentProduct[];
}

type SavedTab = 'favorites' | 'alerts' | 'recent';

const tabs: { id: SavedTab; label: string; description: string }[] = [
  { id: 'favorites', label: 'Favorites', description: 'Products saved from the catalog.' },
  { id: 'alerts', label: 'Alerts', description: 'Products you want to revisit when prices change.' },
  { id: 'recent', label: 'Recent', description: 'Products you have requested before.' },
];

function normalizeTab(value: string | null | undefined): SavedTab {
  return value === 'alerts' || value === 'recent' || value === 'favorites' ? value : 'favorites';
}

function formatLastOrderedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'date unavailable';

  const now = new Date();
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  }).format(date);
}

export default function SavedContent({ initialTab, counts, recentProducts }: SavedContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SavedTab>(initialTab);
  const [visitedTabs, setVisitedTabs] = useState<SavedTab[]>([initialTab]);
  useEffect(() => { setVisitedTabs(tabs => tabs.includes(activeTab) ? tabs : [...tabs, activeTab]); }, [activeTab]);

  useEffect(() => {
    setActiveTab(normalizeTab(searchParams.get('tab')));
  }, [searchParams]);

  const selectTab = (tab: SavedTab) => {
    setActiveTab(tab);
    router.replace(`/dispensary/saved?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Saved"
        mobileInlineActions
        actions={
          <Link
            href="/dispensary/catalog"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-500 px-4 text-sm font-medium text-[#032116] hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas sm:w-auto"
          >
            Catalog
          </Link>
        }
      />

      <div className="rounded-xl border border-pf-line bg-pf-surface p-2 shadow-sm">
        <div role="tablist" aria-label="Saved workspace" className="grid grid-cols-3 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab" id={`saved-tab-${tab.id}`} aria-controls={`saved-panel-${tab.id}`} aria-selected={activeTab === tab.id}
              type="button"
              onClick={() => selectTab(tab.id)}
              aria-label={`${tab.label} (${counts[tab.id] ?? 0})`}
              className={`min-h-10 rounded-lg px-2 py-2 text-center transition ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-[#032116] shadow-sm'
                  : 'text-pf-secondary hover:bg-pf-canvas'
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas`}
            >
              <span className="block text-sm font-semibold">
                {tab.label} ({counts[tab.id] ?? 0})
              </span>

            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" id="saved-panel-favorites" aria-labelledby="saved-tab-favorites" hidden={activeTab !== 'favorites'}>{visitedTabs.includes('favorites') && <FavoritesContent embedded />}</div>
      <div role="tabpanel" id="saved-panel-alerts" aria-labelledby="saved-tab-alerts" hidden={activeTab !== 'alerts'}>{visitedTabs.includes('alerts') && <PriceAlertsContent embedded />}</div>
      {activeTab === 'recent' && (
        <div role="tabpanel" id="saved-panel-recent" aria-labelledby="saved-tab-recent" className="rounded-xl border border-pf-line bg-pf-surface shadow-sm">
          {recentProducts.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <h3 className="text-base font-semibold text-pf-text">No recent requests yet</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-pf-muted">
                Requested products appear here so you can find them again.
              </p>
              <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
                <Link
                  href="/dispensary/catalog"
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-emerald-500 px-3 text-sm font-medium text-[#032116] hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
                >
                  Browse products
                </Link>
                <button
                  type="button"
                  onClick={() => selectTab('favorites')}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-pf-line-strong px-3 text-sm font-medium text-pf-secondary hover:bg-pf-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
                >
                  View favorites
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-pf-line">
              {recentProducts.map((product) => (
                <div key={product.productId} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium text-pf-text">{product.name}</p>
                    <p className="text-sm text-pf-muted">
                      {product.growerName} · {pluralize(product.orderCount, 'request')} · {formatLastOrderedDate(product.lastOrderedAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-pf-raised px-2 py-1 text-sm text-pf-secondary">
                      ${product.price.toFixed(2)}{product.unit ? `/${product.unit.toLowerCase() === 'gram' ? 'g' : product.unit}` : ''}
                    </span>
                    <Link
                      href={`/dispensary/catalog?search=${encodeURIComponent(product.name)}&product=${encodeURIComponent(product.productId)}`}
                      className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-[#032116] hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
                    >
                      Find again
                    </Link>
                    <Link
                      href={`/dispensary/grower/${product.growerId}`}
                      className="rounded-lg border border-pf-line-strong px-3 py-2 text-sm font-medium text-pf-secondary hover:bg-pf-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
                    >
                      View grower
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
