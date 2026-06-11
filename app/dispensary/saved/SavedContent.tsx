'use client';

import { useState } from 'react';
import Link from 'next/link';
import FavoritesContent from '../favorites/FavoritesContent';
import PriceAlertsContent from '../price-alerts/PriceAlertsContent';

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
  recentProducts: RecentProduct[];
}

type SavedTab = 'favorites' | 'alerts' | 'recent';

const tabs: { id: SavedTab; label: string; description: string }[] = [
  { id: 'favorites', label: 'Favorites', description: 'Products saved from the catalog.' },
  { id: 'alerts', label: 'Price Alerts', description: 'Products you want to revisit when prices change.' },
  { id: 'recent', label: 'Recently Requested', description: 'Products you have requested before.' },
];

export default function SavedContent({ recentProducts }: SavedContentProps) {
  const [activeTab, setActiveTab] = useState<SavedTab>('favorites');

  return (
    <div className="space-y-5 pb-20 sm:pb-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Saved Workspace</h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">
            Favorites, price alerts, and repeat-request products in one buyer workspace.
          </p>
        </div>
        <Link
          href="/dispensary/catalog"
          className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-green-600 px-4 text-sm font-medium text-white hover:bg-green-700 sm:w-auto"
        >
          Browse Catalog
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-label={`${tab.label}: ${tab.description}`}
              className={`rounded-lg px-3 py-3 text-left transition ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="block text-sm font-semibold">{tab.label}</span>
              <span className={`mt-1 block text-xs ${activeTab === tab.id ? 'text-green-50' : 'text-gray-500'}`}>
                {tab.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'favorites' && <FavoritesContent embedded />}
      {activeTab === 'alerts' && <PriceAlertsContent embedded />}
      {activeTab === 'recent' && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">Recently Requested</h2>
            <p className="mt-1 text-sm text-gray-500">Use these products as a starting point for repeat order requests.</p>
          </div>
          {recentProducts.length === 0 ? (
            <div className="p-6 text-center">
              <h3 className="text-base font-semibold text-gray-900">No recent requests yet</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-gray-600">
                Products you request will appear here for quick reorder context. Start from the catalog or save products first if you are still comparing.
              </p>
              <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
                <Link
                  href="/dispensary/catalog"
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-green-600 px-3 text-sm font-medium text-white hover:bg-green-700"
                >
                  Browse products
                </Link>
                <button
                  type="button"
                  onClick={() => setActiveTab('favorites')}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  View favorites
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentProducts.map((product) => (
                <div key={product.productId} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">
                      {product.growerName} - ordered {product.orderCount} time{product.orderCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-sm text-gray-700">
                      ${product.price.toFixed(2)}{product.unit ? `/${product.unit}` : ''}
                    </span>
                    <Link
                      href={`/dispensary/catalog?search=${encodeURIComponent(product.name)}&product=${encodeURIComponent(product.productId)}`}
                      className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      Find again
                    </Link>
                    <Link
                      href={`/dispensary/grower/${product.growerId}`}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
