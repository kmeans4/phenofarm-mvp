'use client';

import type { BuyerCatalogPage } from '@/lib/buyer-catalog';
import { normalizeLabReports, type LabReportKey } from '@/lib/lab-reports';
import { LabReportDownloads } from '@/app/dispensary/components/LabReportDownloads';
import { getThcBadgeColor, getCbdBadgeColor, getStrainTypeColor } from '@/lib/product-badges';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from "next/link";
import { createPortal } from 'react-dom';
import { usePathname, useSearchParams } from 'next/navigation';
import { LayoutGrid, List as ListIcon, SlidersHorizontal, X, ArrowUpDown, Loader2, Clock, TrendingUp, Search, MapPin, Scale, BarChart3, Leaf, Dna, MessageSquare, ZoomIn, BadgeCheck } from "lucide-react";
import { Bookmark, BookmarkCheck, Heart, Bell, BellRing } from "lucide-react";
import AddToCartButton from "./components/AddToCartButton";
import { useBuyerCollection } from '../hooks/useBuyerCollection';
import { Modal } from '@/app/components/ui/Modal';
import CartBadge from "./components/CartBadge";
import MobileFilterSheet from "./components/MobileFilterSheet";
import { ErrorState } from '@/app/components/ui/FetchState';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { ProductImage } from '@/app/components/ui/ProductImage';
import { useFocusTrap } from '@/app/hooks/useFocusTrap';
import { useBodyOverlay } from '@/app/hooks/useBodyOverlay';
import { toast } from '@/app/hooks/useToast';
import { getAllProductTypes } from '@/lib/product-types';
import { THC_RANGES, PRICE_RANGES, type FilterState } from '@/lib/catalog-filters';
import { pluralize } from '@/lib/utils';
import {
  toSafeAvailability,
  toSafeBoolean,
  toSafeNonNegativeInteger,
  toSafeNonNegativeNumber,
  toSafeOptionalNumber,
  toSafeOptionalString,
  toSafeProductName,
  toSafeProductType,
  toSafeStringArray,
  toSafeUnit,
} from '@/lib/product-serializers';

function displayUnit(unit: string | null | undefined) { return unit?.toLowerCase() === 'gram' ? 'g' : unit || 'unit'; }

interface Product {
  id: string;
  name: string;
  price: number;
  isPriceVisible: boolean;
  strain: string | null;
  strainId: string | null;
  strainType: string | null;
  productType: string | null;
  subType: string | null;
  unit: string | null;
  thc: number | null;
  cbd: number | null;
  images: string[];
  labReports: LabReportKey[];
  inventoryQty: number;
  createdAt?: string;
  grower: {
    id: string;
    businessName: string;
    location?: string | null;
    isVerified?: boolean;
  };
}

interface SavedFilter {
  id: string;
  name: string;
  filters: FilterState;
  searchQuery: string;
  sortBy: SortOption;
  createdAt: string;
}
interface SearchSuggestion {
  text: string;
  type: string;
  id?: string;
}

interface StoredPriceAlert {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  growerName: string;
  growerId: string;
  targetPrice: number;
  currentPrice: number;
  thc: number | null;
  productType: string | null;
  unit: string | null;
  inventoryQty?: number;
  createdAt: string;
  isTriggered: boolean;
  triggeredAt?: string;
}

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'thc-asc' | 'thc-desc' | 'name-asc' | 'name-desc';
type ProductTypeCounts = Record<string, number>;
type FilterChip = {
  label: string;
  category: 'productTypes' | 'thcRanges' | 'priceRanges' | 'favorites' | 'recentlyAdded' | 'trending' | 'search' | 'sort';
  value: string;
};

const PRODUCT_TYPES = getAllProductTypes();

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'By grower' },
  { value: 'price-asc', label: 'Price: low' },
  { value: 'price-desc', label: 'Price: high' },
  { value: 'thc-desc', label: 'THC: high' },
  { value: 'thc-asc', label: 'THC: low' },
  { value: 'name-asc', label: 'Name: A-Z' },
  { value: 'name-desc', label: 'Name: Z-A' },
];

const PRICING_MESSAGE_MAX_LENGTH = 600;

const MESSAGE_TEMPLATE_CHIPS = [
  {
    label: 'Pricing & MOQ',
    getMessage: (product: Product) =>
      `Hi ${product.grower.businessName}, can you share current pricing, MOQ, and availability for ${product.name}${product.unit ? ` (${product.unit})` : ''}?`,
  },
  {
    label: 'Availability',
    getMessage: (product: Product) =>
      `Hi ${product.grower.businessName}, is ${product.name} available for fulfillment this week?`,
  },
  {
    label: 'Introduction',
    getMessage: (product: Product) =>
      `Hi ${product.grower.businessName}, I am reaching out from my dispensary and would like to learn more about ${product.name}.`,
  },
] as const;

const ITEMS_PER_PAGE = 20;
const RECENT_SEARCHES_KEY = 'phenofarm_recent_searches';
const MAX_RECENT_SEARCHES = 5;
const MAX_COMPARE_ITEMS = 3;
const COMPARE_STORAGE_KEY = 'phenofarm_compare_products';
const MAX_PRICE_ALERTS = 20;
const MAX_SAVED_FILTERS = 5;

function readStoredArray<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function writeStoredArray<T>(key: string, value: T[]) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* Caching is optional. */ }
}

function getDisplayStrainType(product: Pick<Product, 'strain' | 'strainType'>) {
  if (product.strainType) return product.strainType;
  if (!product.strain) return null;

  const lower = product.strain.toLowerCase();
  if (lower.includes('indica')) return 'Indica';
  if (lower.includes('sativa')) return 'Sativa';
  return 'Hybrid';
}

function normalizeProductTypeCounts(value: unknown): ProductTypeCounts {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.entries(value as Record<string, unknown>).reduce<ProductTypeCounts>((acc, [type, count]) => {
    const normalizedType = type.trim();
    const normalizedCount = Number(count);
    if (normalizedType && Number.isFinite(normalizedCount) && normalizedCount >= 0) {
      acc[normalizedType] = normalizedCount;
    }
    return acc;
  }, {});
}

function normalizeIds(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === 'string' && !!item))] : [];
}
function normalizeSaved(value: unknown): SavedFilter[] {
  if (!Array.isArray(value)) return [];
  return value.filter(item => item && typeof item === 'object' && typeof item.id === 'string' && typeof item.name === 'string' && item.filters && typeof item.filters === 'object')
    .map(item => ({ id: item.id, name: item.name, filters: { productTypes: normalizeIds(item.filters.productTypes), thcRanges: normalizeIds(item.filters.thcRanges), priceRanges: normalizeIds(item.filters.priceRanges), recentlyAdded: item.filters.recentlyAdded === true, trending: item.filters.trending === true },
      searchQuery: typeof item.searchQuery === 'string' ? item.searchQuery : '', sortBy: SORT_OPTIONS.some(option => option.value === item.sortBy) ? item.sortBy as SortOption : 'default' as const,
      createdAt: typeof item.createdAt === 'string' && Number.isFinite(Date.parse(item.createdAt)) ? item.createdAt : new Date(0).toISOString(),
    })).slice(0, MAX_SAVED_FILTERS);
}
function normalizeAlerts(value: unknown): StoredPriceAlert[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is StoredPriceAlert => !!item && typeof item === 'object' && typeof item.productId === 'string' && Number.isFinite(Number(item.targetPrice)) && Number(item.targetPrice) > 0).slice(0, MAX_PRICE_ALERTS);
}

function normalizeCatalogProduct(raw: unknown): Product | null {
  if (!raw || typeof raw !== 'object') return null;

  const record = raw as Record<string, unknown>;
  const id = toSafeOptionalString(record.id);
  if (!id) return null;

  const inventoryQty = toSafeNonNegativeInteger(record.inventoryQty, 0);
  const isAvailable = toSafeAvailability(record.isAvailable, inventoryQty);
  if (!isAvailable) return null;

  const rawGrower = record.grower;
  const growerRecord = rawGrower && typeof rawGrower === 'object'
    ? (rawGrower as Record<string, unknown>)
    : null;

  const growerId = growerRecord ? toSafeOptionalString(growerRecord.id) : null;
  const growerName = growerRecord ? toSafeOptionalString(growerRecord.businessName) : null;

  if (!growerId || !growerName) return null;

  return {
    id,
    name: toSafeProductName(record.name),
    price: toSafeNonNegativeNumber(record.price, 0),
    isPriceVisible: toSafeBoolean(record.isPriceVisible, true),
    strain: toSafeOptionalString(record.strain),
    strainId: toSafeOptionalString(record.strainId),
    strainType: toSafeOptionalString(record.strainType),
    productType: toSafeProductType(record.productType),
    subType: toSafeOptionalString(record.subType),
    unit: toSafeUnit(record.unit),
    thc: toSafeOptionalNumber(record.thc),
    cbd: toSafeOptionalNumber(record.cbd),
    images: toSafeStringArray(record.images),
    labReports: normalizeLabReports(record.labReports),
    inventoryQty,
    createdAt: toSafeOptionalString(record.createdAt) || undefined,
    grower: {
      id: growerId,
      businessName: growerName,
      location: toSafeOptionalString(growerRecord?.location),
      isVerified: toSafeBoolean(growerRecord?.isVerified, false),
    },
  };
}

export default function CatalogContent({ initialData }: { initialData?: BuyerCatalogPage }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const initialSearchQuery = searchParams.get('search') || '';
  const initialSortBy = SORT_OPTIONS.some((option) => option.value === searchParams.get('sortBy'))
    ? (searchParams.get('sortBy') as SortOption)
    : 'default';
  const highlightedProductId = searchParams.get('product') || '';

  // State
  const [products, setProducts] = useState<Product[]>(() => initialData?.products.map(normalizeCatalogProduct).filter((product): product is Product => product !== null) || []);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>(initialSortBy);
  const [filters, setFilters] = useState<FilterState>({
    productTypes: searchParams.get('productTypes')?.split(',').filter(Boolean) || [],
    thcRanges: searchParams.get('thcRanges')?.split(',').filter(Boolean) || [],
    priceRanges: searchParams.get('priceRanges')?.split(',').filter(Boolean) || [],
    recentlyAdded: searchParams.get('recentlyAdded') === 'true',
    trending: searchParams.get('trending') === 'true',
  });

  // Mobile filter sheet state
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeHiddenFilters = () => {
      if (desktop.matches) setShowMobileFilters(false);
      else setShowFilters(false);
    };
    desktop.addEventListener('change', closeHiddenFilters);
    return () => desktop.removeEventListener('change', closeHiddenFilters);
  }, []);

  // Compare state
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showCompareBar, setShowCompareBar] = useState(true);  // Saved filters state
  const { items: savedFilters, setItems: setSavedFilters, error: savedSyncError } = useBuyerCollection('saved-filters', normalizeSaved);
  const { items: storedPriceAlerts, setItems: setStoredPriceAlerts, error: alertSyncError } = useBuyerCollection('price-alerts', normalizeAlerts);
  const priceAlerts = storedPriceAlerts.map(alert => alert.productId);
  const [showPriceAlertModal, setShowPriceAlertModal] = useState(false);
  const [priceAlertProduct, setPriceAlertProduct] = useState<Product | null>(null);
  const [targetPrice, setTargetPrice] = useState('');
  const [alertError, setAlertError] = useState('');
  const { items: favorites, setItems: setFavorites, error: favoriteSyncError } = useBuyerCollection('favorites', normalizeIds);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(searchParams.get('favorites') === 'true');
  const [showSaveFilterModal, setShowSaveFilterModal] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [savedFilterError, setSavedFilterError] = useState('');

  const [requestPricingProduct, setRequestPricingProduct] = useState<Product | null>(null);
  const [requestPricingMessage, setRequestPricingMessage] = useState('');
  const [requestPricingMode, setRequestPricingMode] = useState<'REQUEST_PRICING' | 'QUESTION'>('REQUEST_PRICING');
  const [requestPricingSending, setRequestPricingSending] = useState(false);
  const [requestPricingError, setRequestPricingError] = useState('');
  useBodyOverlay(
    showMobileFilters ||
    showCompareModal ||
    showPriceAlertModal ||
    showSaveFilterModal ||
    requestPricingProduct !== null,
  );


  // Search autocomplete state
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Infinite scroll state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialData?.hasMore ?? true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(!initialData);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(initialData?.total ?? 0);
  const [productTypeCounts, setProductTypeCounts] = useState<ProductTypeCounts>(initialData?.productTypeCounts || {});

  // Refs
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const requestSequence = useRef(0);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearchQuery);
  const suggestionsController = useRef<AbortController | null>(null);
  const suggestionsSequence = useRef(0);
  const compareReady = useRef(false);
  const compareTouched = useRef(false);
  const fetchControllerRef = useRef<AbortController | null>(null);


  const requestPricingModalRef = useRef<HTMLDivElement | null>(null);
  const requestPricingTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const closeRequestPricingModal = useCallback(() => {
    setRequestPricingProduct(null);
    setRequestPricingError('');
  }, []);

  useFocusTrap({
    active: Boolean(requestPricingProduct),
    containerRef: requestPricingModalRef,
    initialFocusRef: requestPricingTextareaRef,
    onEscape: closeRequestPricingModal,
  });

  const writtenUrl = useRef(searchParams.toString());
  const applyingUrl = useRef(false);
  useEffect(() => {
    if (searchParams.toString() === writtenUrl.current) return;
    writtenUrl.current = searchParams.toString();
    applyingUrl.current = true;
    setShowFavoritesOnly(searchParams.get('favorites') === 'true');
    const nextSearch = searchParams.get('search') || '';
    const nextSort = SORT_OPTIONS.some((option) => option.value === searchParams.get('sortBy'))
      ? (searchParams.get('sortBy') as SortOption)
      : 'default';

    setSearchQuery((current) => (current === nextSearch ? current : nextSearch));
    setSortBy((current) => (current === nextSort ? current : nextSort));
    setFilters((current) => {
      const nextFilters = {
        productTypes: searchParams.get('productTypes')?.split(',').filter(Boolean) || [],
        thcRanges: searchParams.get('thcRanges')?.split(',').filter(Boolean) || [],
        priceRanges: searchParams.get('priceRanges')?.split(',').filter(Boolean) || [],
        recentlyAdded: searchParams.get('recentlyAdded') === 'true',
        trending: searchParams.get('trending') === 'true',
      };

      return JSON.stringify(current) === JSON.stringify(nextFilters) ? current : nextFilters;
    });
    setShowSuggestions(false);
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (applyingUrl.current) { applyingUrl.current = false; return; }
    if (debouncedSearch !== searchQuery) return;
    const params = new URLSearchParams(searchParams.toString());
    const values: Record<string, string> = { search: debouncedSearch, sortBy: sortBy === 'default' ? '' : sortBy,
      productTypes: filters.productTypes.join(','), thcRanges: filters.thcRanges.join(','), priceRanges: filters.priceRanges.join(','),
      recentlyAdded: filters.recentlyAdded ? 'true' : '', trending: filters.trending ? 'true' : '', favorites: showFavoritesOnly ? 'true' : '' };
    for (const [key, value] of Object.entries(values)) { if (value) params.set(key, value); else params.delete(key); }
    const query = params.toString();
    if (query !== searchParams.toString()) { writtenUrl.current = query; window.history.replaceState(null, '', `${pathname}${query ? `?${query}` : ''}`); }
  }, [debouncedSearch, searchQuery, sortBy, filters, showFavoritesOnly, pathname, searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    const stored = readStoredArray<unknown>(COMPARE_STORAGE_KEY);
    const ids = normalizeIds(stored.map(value => typeof value === 'string' ? value : value && typeof value === 'object' && 'id' in value ? value.id : null)).slice(0, MAX_COMPARE_ITEMS);
    const load = async () => {
      try {
        if (ids.length) {
          const response = await fetch('/api/dispensary/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productIds: ids }), signal: controller.signal });
          if (!response.ok) throw new Error('Unable to refresh comparison.');
          const data = await response.json();
          if (!Array.isArray(data.products)) throw new Error('Invalid comparison response.');
          if (!controller.signal.aborted) {
            if (!compareTouched.current) setCompareList(data.products.map(normalizeCatalogProduct).filter((item: Product | null): item is Product => item !== null));
            compareReady.current = true;
          }
        } else compareReady.current = true;
      } catch { /* Keep stored IDs for the next successful refresh. */ }
    };
    void load();
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (compareReady.current) writeStoredArray(COMPARE_STORAGE_KEY, compareList.map(product => product.id));
  }, [compareList]);

  const toggleFavorite = useCallback((productId: string) => {
    setFavorites(previous => previous.includes(productId) ? previous.filter(id => id !== productId) : [...previous, productId]);
  }, [setFavorites]);
  const isFavorite = useCallback((productId: string) => favorites.includes(productId), [favorites]);

  // Check if product has price alert
  const hasPriceAlert = useCallback((productId: string) => {
    return priceAlerts.includes(productId);
  }, [priceAlerts]);



  // Add product to compare
  const addToCompare = useCallback((product: Product) => {
    compareReady.current = true; compareTouched.current = true;
    setShowCompareBar(true);
    setCompareList(prev => {
      if (prev.find(p => p.id === product.id)) return prev;
      if (prev.length >= MAX_COMPARE_ITEMS) {
        // Remove first item if at max
        return [...prev.slice(1), product];
      }
      return [...prev, product];
    });
  }, []);

  // Remove product from compare
  const removeFromCompare = useCallback((productId: string) => {
    compareTouched.current = true;
    setCompareList(prev => prev.filter(p => p.id !== productId));
  }, []);

  // Check if product is in compare list
  const isInCompareList = useCallback((productId: string) => {
    return compareList.some(p => p.id === productId);
  }, [compareList]);

  // Clear all compare items
  const clearCompare = useCallback(() => {
    compareTouched.current = true;
    setCompareList([]);
  }, []);
  // Save current filter configuration
  const saveCurrentFilter = useCallback(() => {
    if (!newFilterName.trim()) return;

    const hasActiveFilters = filters.productTypes.length > 0 ||
                             filters.thcRanges.length > 0 ||
                             filters.priceRanges.length > 0 ||
                             searchQuery ||
                             sortBy !== 'default' || filters.recentlyAdded || filters.trending;

    if (!hasActiveFilters) {
      setSavedFilterError('Apply at least one filter, search term, or sort option before saving.');
      return;
    }

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: newFilterName.trim(),
      filters: { ...filters },
      searchQuery,
      sortBy,
      createdAt: new Date().toISOString(),
    };

    setSavedFilters(prev => {
      const updated = [newFilter, ...prev].slice(0, MAX_SAVED_FILTERS);
      return updated;
    });

    setNewFilterName('');
    setSavedFilterError('');
    setShowSaveFilterModal(false);
  }, [filters, searchQuery, sortBy, newFilterName, setSavedFilters]);

  // Apply a saved filter
  const applySavedFilter = useCallback((savedFilter: SavedFilter) => {
    setFilters(savedFilter.filters);
    setSearchQuery(savedFilter.searchQuery);
    setSortBy(savedFilter.sortBy);
  }, []);

  // Delete a saved filter
  const deleteSavedFilter = useCallback((filterId: string) => {
    setSavedFilters(prev => prev.filter(f => f.id !== filterId));
  }, [setSavedFilters]);

  const openSaveFilterModal = () => {
    setSavedFilterError('');
    setShowSaveFilterModal(true);
  };



  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load recent searches:', e);
    }


  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return;

    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      let searches: string[] = stored ? JSON.parse(stored) : [];

      // Remove duplicates and add to front
      searches = searches.filter(s => s.toLowerCase() !== query.toLowerCase());
      searches.unshift(query);
      searches = searches.slice(0, MAX_RECENT_SEARCHES);

      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
      setRecentSearches(searches);
    } catch (e) {
      console.error('Failed to save recent search:', e);
    }
  }, []);

  useEffect(() => {
    suggestionsController.current?.abort();
    const sequence = ++suggestionsSequence.current;
    const controller = new AbortController(); suggestionsController.current = controller;
    setHighlightedIndex(-1);
    if (searchQuery.length < 2) { setSuggestions([]); setIsSearching(false); return () => controller.abort(); }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/dispensary/search-suggestions?q=${encodeURIComponent(searchQuery)}&limit=8`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error('Unable to load suggestions');
        if (sequence === suggestionsSequence.current && !controller.signal.aborted) setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      } catch { /* Search itself remains available if suggestions fail. */ }
      finally { if (sequence === suggestionsSequence.current && !controller.signal.aborted) setIsSearching(false); }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [searchQuery]);
  const handleSearchInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value); setShowSuggestions(true); setHighlightedIndex(-1);
  };
  const visibleSuggestions: SearchSuggestion[] = searchQuery.length >= 2 ? suggestions : recentSearches.map(text => ({ text, type: 'recent' }));

  // Handle search submission
  const handleSearchSubmit = (query: string) => {
    setSearchQuery(query);
    setShowSuggestions(false);
    saveRecentSearch(query);
    // Trigger search via the existing useEffect
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    setRecentSearches([]);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allItems = visibleSuggestions;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev < allItems.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && allItems[highlightedIndex]) {
          handleSearchSubmit(allItems[highlightedIndex].text);
        } else if (searchQuery.trim()) {
          handleSearchSubmit(searchQuery);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        searchInputRef.current?.blur();
        break;
    }
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle filter value (only for array-based filters, not recentlyAdded)
  const toggleFilter = (category: 'productTypes' | 'thcRanges' | 'priceRanges', value: string) => {
    setFilters(prev => {
      const current = prev[category];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({ productTypes: [], thcRanges: [], priceRanges: [], recentlyAdded: false, trending: false })
    setSearchQuery('');
    setSortBy('default');
    setShowSuggestions(false);
    setShowFavoritesOnly(false);
  };

  const favoriteIdsKey = showFavoritesOnly ? favorites.join(',') : '';
  const requestKey = JSON.stringify([debouncedSearch, filters, sortBy, showFavoritesOnly, favoriteIdsKey]);
  const hydratedRequestKey = useRef<string | null>(initialData ? requestKey : null);

  // Fetch products from API
  const fetchProducts = useCallback(async (pageNum: number, append: boolean = false) => {
    const sequence = ++requestSequence.current;
    fetchControllerRef.current?.abort();
    const controller = new AbortController(); fetchControllerRef.current = controller;
    setIsLoading(true);
    setFetchError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', pageNum.toString());
      params.set('limit', ITEMS_PER_PAGE.toString());

      if (debouncedSearch) params.set('search', debouncedSearch);
      if (showFavoritesOnly) { params.set('favorites', 'true'); params.set('favoriteIds', favoriteIdsKey); }
      if (filters.productTypes.length > 0) params.set('productTypes', filters.productTypes.join(','));
      if (filters.thcRanges.length > 0) params.set('thcRanges', filters.thcRanges.join(','));
      if (filters.priceRanges.length > 0) params.set('priceRanges', filters.priceRanges.join(','));
      if (sortBy !== 'default') params.set('sortBy', sortBy);
      if (filters.recentlyAdded) params.set('recentlyAdded', 'true');
      if (filters.trending) params.set('trending', 'true');

      const response = await fetch(`/api/dispensary/catalog?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products (${response.status})`);
      }

      const data = await response.json();
      const normalizedProducts = Array.isArray(data.products)
        ? (data.products as unknown[])
            .map(normalizeCatalogProduct)
            .filter((item: Product | null): item is Product => item !== null)
        : [];

      if (controller.signal.aborted || sequence !== requestSequence.current) return;
      if (append) {
        setProducts(prev => [...new Map([...prev, ...normalizedProducts].map(product => [product.id, product])).values()]);
      } else {
        setProducts(normalizedProducts);
      }

      setHasMore(Boolean(data.hasMore));
      setTotalProducts(toSafeNonNegativeInteger(data.total, 0));
      setProductTypeCounts(normalizeProductTypeCounts(data.productTypeCounts));
      setPage(pageNum);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      if (sequence === requestSequence.current) setFetchError(error instanceof Error ? error.message : 'Failed to fetch products.');
    } finally {
      if (sequence === requestSequence.current && !controller.signal.aborted) { setIsLoading(false); setIsInitialLoading(false); }
    }
  }, [debouncedSearch, filters, sortBy, showFavoritesOnly, favoriteIdsKey]);

  // Cancel in-flight catalog requests when leaving this page.
  useEffect(() => {
    return () => {
      fetchControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (hydratedRequestKey.current === requestKey) return;
    hydratedRequestKey.current = null;
    void fetchProducts(1, false);
    return () => fetchControllerRef.current?.abort();
  }, [fetchProducts, requestKey]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchProducts(page + 1, true);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, page, fetchProducts]);

  // Filter products by favorites if needed
  const filteredProducts = products;
  const visibleProductCount = totalProducts;
  const highlightedProductLoaded = useMemo(() => (
    Boolean(highlightedProductId && filteredProducts.some((product) => product.id === highlightedProductId))
  ), [filteredProducts, highlightedProductId]);

  // Group products by grower when not sorting
  const groupedProducts = useMemo(() => (
    sortBy === 'default'
      ? groupByGrower(filteredProducts)
      : [{ growerId: 'all', growerName: 'All Products', products: filteredProducts }]
  ), [sortBy, filteredProducts]);

  useEffect(() => {
    if (!highlightedProductId || !highlightedProductLoaded || isInitialLoading || isLoading) return;

    const timeoutId = window.setTimeout(() => {
      document
        .getElementById(`catalog-product-${highlightedProductId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);

    return () => window.clearTimeout(timeoutId);
  }, [highlightedProductId, highlightedProductLoaded, isInitialLoading, isLoading, viewMode]);

  // Get active filter count
  const activeFilterCount = useMemo(() => (
    filters.productTypes.length
    + filters.thcRanges.length
    + filters.priceRanges.length
    + (filters.recentlyAdded ? 1 : 0)
    + (filters.trending ? 1 : 0)
    + (showFavoritesOnly ? 1 : 0)
  ), [filters, showFavoritesOnly]);

  const hasActiveCatalogState = Boolean(
    activeFilterCount > 0
    || searchQuery.trim()
    || sortBy !== 'default'
  );

  const productTypeFilterOptions = useMemo(() => {
    const baseTypes = new Set(PRODUCT_TYPES);
    const customTypes = Object.keys(productTypeCounts)
      .filter((type) => !baseTypes.has(type))
      .sort((a, b) => a.localeCompare(b));

    return [...PRODUCT_TYPES, ...customTypes]
      .map((type) => ({
        type,
        count: productTypeCounts[type] || 0,
        isSelected: filters.productTypes.includes(type),
      }))
      .filter((option) => option.count > 0 || option.isSelected);
  }, [filters.productTypes, productTypeCounts]);

  // Get active filter chips
  const filterChips = useMemo(() => {
    const chips: FilterChip[] = [];

    if (showFavoritesOnly) {
      chips.push({ label: `Favorites (${pluralize(favorites.length, 'item')})`, category: 'favorites', value: 'favorites' });
    }

    if (filters.recentlyAdded) {
      chips.push({ label: 'Recently Added (7 days)', category: 'recentlyAdded', value: 'recentlyAdded' });
    }

    if (filters.trending) {
      chips.push({ label: 'Trending', category: 'trending', value: 'trending' });
    }

    filters.productTypes.forEach((type) => {
      chips.push({ label: type, category: 'productTypes', value: type });
    });

    filters.thcRanges.forEach((rangeId) => {
      const range = THC_RANGES.find((r) => r.id === rangeId);
      if (range) chips.push({ label: `THC: ${range.label}`, category: 'thcRanges', value: rangeId });
    });

    filters.priceRanges.forEach((rangeId) => {
      const range = PRICE_RANGES.find((r) => r.id === rangeId);
      if (range) chips.push({ label: `Price: ${range.label}`, category: 'priceRanges', value: rangeId });
    });

    return chips;
  }, [showFavoritesOnly, favorites.length, filters]);

  // Get icon for suggestion type
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'product': return <Leaf size={16} className="text-pf-accent" />;
      case 'strain': return <Dna size={16} className="text-pf-purple" />;
      case 'grower': return <MapPin size={16} className="text-pf-info" />;
      case 'category': return <LayoutGrid size={16} className="text-pf-warning" />;
      case 'recent': return <Clock size={16} className="text-pf-muted" />;
      case 'popular': return <TrendingUp size={16} className="text-pf-danger" />;
      default: return <Search size={16} className="text-pf-muted" />;
    }
  };

  // Get label for suggestion type
  const getSuggestionLabel = (type: string) => {
    switch (type) {
      case 'product': return 'Product';
      case 'strain': return 'Strain';
      case 'grower': return 'Grower';
      case 'category': return 'Category';
      case 'recent': return 'Recent';
      case 'popular': return 'Popular';
      default: return 'Search';
    }
  };

  // ============ PRICE ALERT FUNCTIONS ============
  const openPriceAlertModal = (product: Product) => {
    const existingAlert = storedPriceAlerts.find((alert) => alert.productId === product.id);

    setPriceAlertProduct(product);
    setTargetPrice(
      existingAlert
        ? existingAlert.targetPrice.toFixed(2)
        : (product.price * 0.9).toFixed(2)
    );
    setAlertError('');
    setShowPriceAlertModal(true);
  };

  const savePriceAlert = () => {
    if (!priceAlertProduct) return;

    const target = parseFloat(targetPrice);
    if (isNaN(target) || target <= 0) {
      setAlertError('Enter a target price greater than $0.');
      return;
    }

    if (target >= priceAlertProduct.price) {
      setAlertError(`Target must be below the current price of $${priceAlertProduct.price.toFixed(2)}.`);
      return;
    }

    const existingAlert = storedPriceAlerts.find((alert) => alert.productId === priceAlertProduct.id);

    if (!existingAlert && storedPriceAlerts.length >= MAX_PRICE_ALERTS) {
      setAlertError(`Maximum ${MAX_PRICE_ALERTS} alerts allowed. Remove some first.`);
      return;
    }

    const newAlert: StoredPriceAlert = {
      id: existingAlert?.id || Date.now().toString(),
      productId: priceAlertProduct.id,
      productName: priceAlertProduct.name,
      productImage: priceAlertProduct.images?.[0],
      growerName: priceAlertProduct.grower.businessName,
      growerId: priceAlertProduct.grower.id,
      targetPrice: target,
      currentPrice: priceAlertProduct.price,
      thc: priceAlertProduct.thc,
      productType: priceAlertProduct.productType,
      unit: priceAlertProduct.unit,
      inventoryQty: priceAlertProduct.inventoryQty,
      createdAt: existingAlert?.createdAt || new Date().toISOString(),
      isTriggered: false,
    };

    const updated = [
      ...storedPriceAlerts.filter((alert) => alert.productId !== priceAlertProduct.id),
      newAlert,
    ];
    setStoredPriceAlerts(updated);

    setShowPriceAlertModal(false);
    toast.success("Alert set — we'll flag it in Saved → Price Alerts when the price drops");
  };

  const openPricingMessageModal = (product: Product, mode: 'REQUEST_PRICING' | 'QUESTION') => {
    const defaultMessage = mode === 'REQUEST_PRICING'
      ? MESSAGE_TEMPLATE_CHIPS[0].getMessage(product)
      : `Hi ${product.grower.businessName}, I have a question about ${product.name}.`;

    setRequestPricingMode(mode);
    setRequestPricingProduct(product);
    setRequestPricingMessage(defaultMessage);
    setRequestPricingError('');
  };

  const sendPricingMessage = async () => {
    if (!requestPricingProduct) return;

    const message = requestPricingMessage.trim();
    if (!message) {
      setRequestPricingError('Message is required.');
      return;
    }

    setRequestPricingSending(true);
    setRequestPricingError('');

    try {
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          growerId: requestPricingProduct.grower.id,
          productId: requestPricingProduct.id,
          messageType: requestPricingMode === 'REQUEST_PRICING' ? 'PRICING_REQUEST' : 'TEXT',
          body: message,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setRequestPricingMessage('');
      setRequestPricingMode('REQUEST_PRICING');

      window.dispatchEvent(
        new CustomEvent('phenofarm-open-chat', {
          detail: { conversationId: data.conversationId, flash: true },
        })
      );

      closeRequestPricingModal();
    } catch (err) {
      setRequestPricingError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setRequestPricingSending(false);
    }
  };

  return (
    <div className="relative space-y-4">
      <PageHeader
        title="Catalog"
        mobileInlineActions
        actions={<CartBadge showLink />}
      />

      {/* Search, Sort, and Controls Bar */}
      <div className="relative grid grid-cols-[minmax(0,1fr)_auto] gap-3 lg:flex">
        {/* Search with Autocomplete */}
        <div className="relative col-span-2 min-w-0 flex-1" ref={suggestionsRef}>
          <div className="relative">
            <label htmlFor="catalog-search" className="sr-only">Search catalog</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pf-muted" />
            <input
              id="catalog-search"
              ref={searchInputRef}
                role="combobox" aria-autocomplete="list" aria-expanded={showSuggestions} aria-controls="catalog-suggestions" aria-activedescendant={showSuggestions && highlightedIndex >= 0 ? `catalog-suggestion-${highlightedIndex}` : undefined}
              type="text"
              placeholder="Search products or growers"
              value={searchQuery}
              onChange={handleSearchInput}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg border border-pf-line-strong pl-10 pr-10 py-2.5 focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-pf-muted hover:text-pf-muted"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-pf-surface rounded-lg shadow-xl border border-pf-line z-50 max-h-96 overflow-y-auto">
              {!searchQuery && recentSearches.length > 0 && <button type="button" onClick={clearRecentSearches} className="px-4 py-2 text-xs text-pf-danger">Clear recent searches</button>}
              <div id="catalog-suggestions" role="listbox" aria-label="Search suggestions">
                {visibleSuggestions.map((suggestion, index) => (
                  <button key={`${suggestion.type}-${suggestion.text}-${index}`} id={`catalog-suggestion-${index}`} type="button" role="option" aria-selected={highlightedIndex === index} tabIndex={-1}
                    onMouseDown={event => event.preventDefault()} onClick={() => handleSearchSubmit(suggestion.text)}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-pf-canvas ${highlightedIndex === index ? 'bg-pf-accent-bg' : ''}`}>
                    {getSuggestionIcon(suggestion.type)}<span className="flex-1 text-sm">{suggestion.text}</span><span className="text-xs text-pf-muted">{getSuggestionLabel(suggestion.type)}</span>
                  </button>
                ))}
              </div>
              {isSearching ? <p className="px-4 py-3 text-sm text-pf-muted">Searching...</p> : visibleSuggestions.length === 0 ? <p className="px-4 py-3 text-sm text-pf-muted">{searchQuery ? 'Press Enter to search.' : 'Type to search products, strains, and growers.'}</p> : null}
            </div>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative min-w-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label="Sort catalog results"
            className="w-full appearance-none bg-pf-surface border border-pf-line-strong rounded-lg px-3 py-2.5 pr-10 focus:ring-2 focus:ring-emerald-400 focus:border-transparent cursor-pointer text-base sm:text-sm"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pf-muted pointer-events-none" />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                setShowMobileFilters(true);
              } else {
                setShowFilters(!showFilters);
              }
            }}
            aria-label="Toggle filters"
            aria-expanded={showFilters || showMobileFilters}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              showFilters || showMobileFilters
                ? 'bg-emerald-500 text-[#032116] border-emerald-500'
                : 'bg-pf-surface text-pf-secondary border-pf-line-strong hover:bg-pf-canvas'
            }`}
          >
            <SlidersHorizontal size={18} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-pf-surface text-pf-accent text-xs font-bold px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-pf-line-strong overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 flex items-center gap-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-emerald-500 text-[#032116]'
                  : 'bg-pf-surface text-pf-muted hover:bg-pf-canvas'
              }`}
              aria-label="Grid view"
              title="Grid view"
            >
              <LayoutGrid size={18} />
              <span className="hidden sm:inline text-sm">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 flex items-center gap-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-emerald-500 text-[#032116]'
                  : 'bg-pf-surface text-pf-muted hover:bg-pf-canvas'
              }`}
              aria-label="List view"
              title="List view"
            >
              <ListIcon size={18} />
              <span className="hidden sm:inline text-sm">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveCatalogState && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-pf-muted mr-2">Active:</span>
          {sortBy !== 'default' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-pf-purple-bg text-pf-purple text-sm rounded-full">
              {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
              <button
                type="button"
                onClick={() => setSortBy('default')}
                aria-label="Remove sort filter"
                className="rounded-full hover:text-pf-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <X size={14} />
              </button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-pf-info-bg text-pf-info text-sm rounded-full">
              Search: &quot;{searchQuery}&quot;
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Remove search filter"
                className="rounded-full hover:text-pf-info focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <X size={14} />
              </button>
            </span>
          )}
          {filterChips.map((chip) => (
            <span
              key={`${chip.category}-${chip.value}`}
              className="inline-flex items-center gap-1 px-3 py-1 bg-pf-accent-bg text-pf-accent text-sm rounded-full"
            >
              {chip.label}
              <button
                type="button"
                onClick={() => {
                  if (chip.category === "favorites") {
                    setShowFavoritesOnly(false);
                  } else if (chip.category === "recentlyAdded") {
                    setFilters(prev => ({ ...prev, recentlyAdded: false }));
                  } else if (chip.category === "trending") {
                    setFilters(prev => ({ ...prev, trending: false }));
                  } else {
                    toggleFilter(chip.category as 'productTypes' | 'thcRanges' | 'priceRanges', chip.value);
                  }
                }}
                aria-label={`Remove ${chip.label} filter`}
                className="rounded-full hover:text-pf-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <X size={14} />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAllFilters}
            className="ml-2 rounded text-sm text-pf-muted underline hover:text-pf-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-pf-muted" aria-live="polite">
        <span>
          {isInitialLoading
            ? 'Loading...'
            : fetchError
              ? 'Catalog unavailable'
              : showFavoritesOnly
                ? `${visibleProductCount} favorite ${visibleProductCount === 1 ? 'product' : 'products'} shown`
                : `${products.length} of ${totalProducts} product${totalProducts !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="hidden w-64 flex-shrink-0 space-y-6 lg:block">
            {/* Saved Filters Section */}
            {savedFilters.length > 0 && (
              <div className="bg-pf-surface rounded-lg border border-pf-line p-4">
                <h3 className="font-semibold text-pf-text mb-3 flex items-center gap-2">
                  <BookmarkCheck size={18} className="text-pf-accent" />
                  Saved Filters
                </h3>
                <div className="space-y-2">
                  {savedFilters.map((savedFilter) => (
                    <div key={savedFilter.id} className="group flex items-center gap-2 rounded-lg bg-pf-accent-bg px-2 py-2 text-pf-accent">
                      <button
                        type="button"
                        onClick={() => applySavedFilter(savedFilter)}
                        className="min-w-0 flex-1 text-left px-2 py-1 text-sm rounded-md hover:bg-pf-accent-bg transition-colors"
                      >
                        <span className="font-medium truncate block">{savedFilter.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSavedFilter(savedFilter.id)}
                        aria-label={`Delete saved filter ${savedFilter.name}`}
                        className="text-pf-accent hover:text-pf-danger opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save Filter Button */}
            {(filters.productTypes.length > 0 || filters.thcRanges.length > 0 || filters.priceRanges.length > 0 || filters.recentlyAdded || filters.trending || searchQuery || sortBy !== 'default') && (
              <button type="button"
                onClick={openSaveFilterModal}
                className="w-full py-2 px-4 bg-emerald-500 text-[#032116] rounded-lg hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Bookmark size={16} />
                Save Current Filter
              </button>
            )}

            <div className="space-y-2 rounded-lg border border-pf-line bg-pf-surface p-3">
              <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={showFavoritesOnly} onChange={e => setShowFavoritesOnly(e.target.checked)} className="h-4 w-4 accent-emerald-500" />Favorites ({favorites.length})</label>
              <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={filters.recentlyAdded} onChange={e => setFilters(prev => ({ ...prev, recentlyAdded: e.target.checked }))} className="h-4 w-4 accent-emerald-500" />Added in 7 days</label>
            </div>

            {/* Product Type Filter */}
            <div className="bg-pf-surface rounded-lg border border-pf-line p-4">
              <h3 className="font-semibold text-pf-text mb-3">Product Type</h3>
              <div className="space-y-2">
                {productTypeFilterOptions.length > 0 ? (
                  productTypeFilterOptions.map(({ type, count, isSelected }) => (
                    <label
                      key={type}
                      className={`flex items-center gap-2 rounded p-1 ${
                        count > 0 || isSelected
                          ? 'cursor-pointer hover:bg-pf-canvas'
                          : 'cursor-not-allowed text-pf-muted'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleFilter('productTypes', type)}
                        className="w-4 h-4 text-pf-accent border-pf-line-strong rounded focus:ring-emerald-400"
                      />
                      <span className={`min-w-0 flex-1 text-sm ${count > 0 ? 'text-pf-secondary' : 'text-pf-muted'}`}>
                        {type}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        isSelected
                          ? 'bg-pf-accent-bg text-pf-accent'
                          : 'bg-pf-surface text-pf-muted'
                      }`}>
                        {count}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="rounded-lg bg-pf-canvas px-3 py-2 text-sm text-pf-muted">
                    No product types match the current results.
                  </p>
                )}
              </div>
            </div>

            {/* THC Range Filter */}
            <div className="bg-pf-surface rounded-lg border border-pf-line p-4">
              <h3 className="font-semibold text-pf-text mb-3">THC Potency</h3>
              <div className="space-y-2">
                {THC_RANGES.map(range => (
                  <label key={range.id} className="flex items-center gap-2 cursor-pointer hover:bg-pf-canvas p-1 rounded">
                    <input
                      type="checkbox"
                      checked={filters.thcRanges.includes(range.id)}
                      onChange={() => toggleFilter('thcRanges', range.id)}
                      className="w-4 h-4 text-pf-accent border-pf-line-strong rounded focus:ring-emerald-400"
                    />
                    <span className="text-sm text-pf-secondary">{range.label.replace(/ per unit/g, '')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="bg-pf-surface rounded-lg border border-pf-line p-4">
              <h3 className="font-semibold text-pf-text mb-1">Price per unit</h3>

              <div className="space-y-2">
                {PRICE_RANGES.map(range => (
                  <label key={range.id} className="flex items-center gap-2 cursor-pointer hover:bg-pf-canvas p-1 rounded">
                    <input
                      type="checkbox"
                      checked={filters.priceRanges.includes(range.id)}
                      onChange={() => toggleFilter('priceRanges', range.id)}
                      className="w-4 h-4 text-pf-accent border-pf-line-strong rounded focus:ring-emerald-400"
                    />
                    <span className="text-sm text-pf-secondary">{range.label.replace(/ per unit/g, '')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clear All Button */}
            {hasActiveCatalogState && (
              <button type="button"
                onClick={clearAllFilters}
                className="w-full py-2 text-sm text-pf-muted border border-pf-line-strong rounded-lg hover:bg-pf-canvas transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Product Grid/List */}
        <div className="flex-1 min-w-0">
          {isInitialLoading ? (
            <CatalogSkeletonGrid viewMode={viewMode} />
          ) : fetchError ? (
            <ErrorState
              title="Could not load catalog"
              description={fetchError}
              onRetry={() => fetchProducts(1, false)}
            />
          ) : groupedProducts.length > 0 ? (
            <div className="space-y-4">
              {groupedProducts.map(group => (
                <div key={group.growerId} className={`bg-pf-surface rounded-xl shadow-sm border border-pf-line overflow-hidden ${sortBy !== 'default' ? 'border-pf-accent-line ring-1 ring-pf-accent-line' : ''}`}>
                  <div className={`px-4 py-3 border-b border-pf-line ${sortBy !== 'default' ? 'bg-pf-accent-bg' : 'bg-pf-canvas'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="break-words text-base font-semibold text-pf-text sm:text-lg">
                          {group.growerName}
                          {sortBy !== 'default' && (
                            <span className="ml-2 text-sm font-normal text-pf-accent">
                              (sorted by {SORT_OPTIONS.find(o => o.value === sortBy)?.label.toLowerCase()})
                            </span>
                          )}
                        </h2>

                      </div>
                      {group.growerId !== 'all' && (
                        <Link
                          href={`/dispensary/grower/${group.growerId}`}
                          className="inline-flex min-h-10 shrink-0 items-center text-sm text-pf-accent hover:text-pf-accent font-medium"
                        >
                          <span className="hidden sm:mr-1 sm:inline">View</span>Shop →
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="p-3 sm:p-4">
                    {viewMode === 'grid' ? (
                      /* Grid View */
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] gap-4">
                        {group.products.map(product => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            isInCompare={isInCompareList(product.id)}
                            onCompareToggle={() => isInCompareList(product.id) ? removeFromCompare(product.id) : addToCompare(product)}
                            compareDisabled={!isInCompareList(product.id) && compareList.length >= MAX_COMPARE_ITEMS}
                            isFav={isFavorite(product.id)}
                            onFavoriteToggle={() => toggleFavorite(product.id)}
                            hasAlert={hasPriceAlert(product.id)}
                            onAlertToggle={() => openPriceAlertModal(product)}
                            onRequestPricing={() => openPricingMessageModal(product, 'REQUEST_PRICING')}
                            onMessageGrower={() => openPricingMessageModal(product, 'QUESTION')}
                            isHighlighted={highlightedProductId === product.id}
                          />
                        ))}
                      </div>
                    ) : (
                      /* List View */
                      <div className="space-y-2">
                        {group.products.map(product => (
                          <ProductListItem
                            key={product.id}
                            product={product}
                            isInCompare={isInCompareList(product.id)}
                            onCompareToggle={() => isInCompareList(product.id) ? removeFromCompare(product.id) : addToCompare(product)}
                            compareDisabled={!isInCompareList(product.id) && compareList.length >= MAX_COMPARE_ITEMS}
                            isFav={isFavorite(product.id)}
                            onFavoriteToggle={() => toggleFavorite(product.id)}
                            hasAlert={hasPriceAlert(product.id)}
                            onAlertToggle={() => openPriceAlertModal(product)}
                            onRequestPricing={() => openPricingMessageModal(product, 'REQUEST_PRICING')}
                            onMessageGrower={() => openPricingMessageModal(product, 'QUESTION')}
                            isHighlighted={highlightedProductId === product.id}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Infinite Scroll Loading Indicator */}
              <div ref={loadMoreRef} className="py-3">
                {isLoading && hasMore && (
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-pf-accent animate-spin mb-2" />
                    <p className="text-sm text-pf-muted">Loading more products...</p>
                  </div>
                )}
                {!hasMore && products.length > 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-pf-muted">End of results</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-pf-line-strong bg-pf-surface px-4 py-8 text-center sm:py-10">
              <h3 className="text-lg font-semibold text-pf-text mb-2">No matching products</h3>
              <p className="text-pf-muted mb-4">Try a different search or clear your filters.</p>
              <button type="button"
                onClick={clearAllFilters}
                className="px-4 py-2 bg-emerald-500 text-[#032116] rounded-lg hover:bg-emerald-400 transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Compare Bar - Floating at bottom */}
      {compareList.length > 0 && showCompareBar && (
        <div className="fixed bottom-24 left-1/2 z-40 w-full max-w-4xl -translate-x-1/2 px-4 sm:bottom-6">
          <div className="flex flex-col gap-3 rounded-xl border border-pf-line bg-pf-surface p-4 shadow-2xl sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Scale className="w-5 h-5 text-pf-accent" />
              <span className="font-semibold text-pf-text">
                Compare ({compareList.length}/{MAX_COMPARE_ITEMS})
              </span>
            </div>

            <div className="flex-1 flex gap-2 overflow-x-auto">
              {compareList.map(product => (
                <div
                  key={product.id}
                  className="flex items-center gap-2 bg-pf-canvas rounded-lg px-3 py-2 min-w-fit"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-pf-raised text-sm">
                    <ProductImage
                      src={product.images?.[0]}
                      alt={`${product.name} thumbnail`}
                      productType={product.productType}
                      className="h-full w-full rounded"
                    />
                  </div>
                  <span className="text-sm font-medium text-pf-secondary truncate max-w-[120px]">
                    {product.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFromCompare(product.id)}
                    aria-label={`Remove ${product.name} from compare`}
                    className="rounded-full p-1 text-pf-muted hover:bg-pf-danger-bg hover:text-pf-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCompareModal(true)}
                disabled={compareList.length < 2}
                className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-[#032116] transition-colors hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas disabled:cursor-not-allowed disabled:opacity-50"
              >
                <BarChart3 size={18} />
                Compare
              </button>
              <button
                type="button"
                onClick={clearCompare}
                aria-label="Clear compare list"
                className="rounded-lg px-3 py-2 text-sm font-medium text-pf-muted transition-colors hover:bg-pf-danger-bg hover:text-pf-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
                title="Clear all"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setShowCompareBar(false)}
                aria-label="Hide compare bar"
                className="rounded-lg p-2 text-pf-muted hover:bg-pf-raised hover:text-pf-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && (
        <CompareModal
          products={compareList}
          onClose={() => setShowCompareModal(false)}
          onRemove={(productId) => {
            removeFromCompare(productId);
            if (compareList.length <= 2) setShowCompareModal(false);
          }}
          onClear={() => {
            clearCompare();
            setShowCompareModal(false);
          }}
          onRequestPricing={(product) => { setShowCompareModal(false); openPricingMessageModal(product, 'REQUEST_PRICING'); }}
          onMessageGrower={(product) => { setShowCompareModal(false); openPricingMessageModal(product, 'QUESTION'); }}
        />
      )}
      {(savedSyncError || favoriteSyncError || alertSyncError) && <p role="alert" className="rounded-lg bg-pf-danger-bg p-3 text-pf-danger">{savedSyncError || favoriteSyncError || alertSyncError}</p>}
      {/* Save Filter Modal */}
      {showSaveFilterModal && (
        <Modal open onClose={() => setShowSaveFilterModal(false)} title="Save filter">
          <div className="w-full">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-pf-secondary mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={newFilterName}
                  onChange={(e) => setNewFilterName(e.target.value)}
                  placeholder="e.g., Flower under $20"
                  className="w-full rounded-lg border border-pf-line-strong px-4 py-2.5 focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newFilterName.trim()) {
                      saveCurrentFilter();
                    }
                    if (e.key === 'Escape') {
                      setShowSaveFilterModal(false);
                    }
                  }}
                  autoFocus
                />
                {savedFilterError && (
                  <p className="mt-2 rounded-lg border border-pf-warning-line bg-pf-warning-bg px-3 py-2 text-sm text-pf-warning">
                    {savedFilterError}
                  </p>
                )}
              </div>

              {/* Preview of what will be saved */}
              <div className="bg-pf-canvas rounded-lg p-4">
                <p className="text-sm font-medium text-pf-secondary mb-2">Includes</p>
                <div className="flex flex-wrap gap-2">
                  {filters.productTypes.map(type => (
                    <span key={type} className="px-2 py-1 bg-pf-surface text-pf-secondary text-xs rounded border border-pf-line">
                      {type}
                    </span>
                  ))}
                  {filters.thcRanges.map(rangeId => {
                    const range = THC_RANGES.find(r => r.id === rangeId);
                    return range ? (
                      <span key={rangeId} className="px-2 py-1 bg-pf-surface text-pf-secondary text-xs rounded border border-pf-line">
                        THC {range.label}
                      </span>
                    ) : null;
                  })}
                  {filters.priceRanges.map(rangeId => {
                    const range = PRICE_RANGES.find(r => r.id === rangeId);
                    return range ? (
                      <span key={rangeId} className="px-2 py-1 bg-pf-surface text-pf-secondary text-xs rounded border border-pf-line">
                        Price {range.label}
                      </span>
                    ) : null;
                  })}
                  {filters.recentlyAdded && <span className="px-2 py-1 text-xs">Recently added</span>}
                  {filters.trending && <span className="px-2 py-1 text-xs">Trending</span>}
                  {searchQuery && (
                    <span className="px-2 py-1 bg-pf-info-bg text-pf-info text-xs rounded border border-pf-info-line">
                      Search: &quot;{searchQuery}&quot;
                    </span>
                  )}
                  {sortBy !== 'default' && (
                    <span className="px-2 py-1 bg-pf-purple-bg text-pf-purple text-xs rounded border border-pf-purple-line">
                      Sort: {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-pf-muted">
                {savedFilters.length >= MAX_SAVED_FILTERS
                  ? `You have reached the maximum of ${MAX_SAVED_FILTERS} saved filters. Saving will remove the oldest filter.`
                  : `You can save up to ${MAX_SAVED_FILTERS} filters (${MAX_SAVED_FILTERS - savedFilters.length} remaining).`}
              </p>
            </div>

            <div className="mt-4 border-t border-pf-line pt-3 flex justify-end gap-3">
              <button type="button"
                onClick={() => setShowSaveFilterModal(false)}
                className="px-4 py-2 text-pf-secondary hover:bg-pf-surface rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button type="button"
                onClick={saveCurrentFilter}
                disabled={!newFilterName.trim()}
                className="px-4 py-2 bg-emerald-500 text-[#032116] rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save filter
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showPriceAlertModal && priceAlertProduct && (
        <Modal open onClose={() => setShowPriceAlertModal(false)} title="Track a target price">
          <div className="w-full">
            <div className="space-y-3 sm:space-y-4">
              <p className="text-sm text-pf-muted">
                <span className="block font-semibold">{priceAlertProduct.name}</span>Checked when you visit Saved or refresh.
              </p>
              <div>
                <label htmlFor="target-price-alert" className="block text-sm font-medium text-pf-secondary mb-2">Target price ($/{displayUnit(priceAlertProduct.unit)})</label>
                <input
                  id="target-price-alert"
                  type="number"
                  min="0.01"
                  max={Math.max(0.01, priceAlertProduct.price - 0.01)}
                  step="0.01"
                  value={targetPrice}
                  onChange={(e) => {
                    setTargetPrice(e.target.value);
                    if (alertError) setAlertError('');
                  }}
                  aria-invalid={Boolean(alertError)}
                  aria-describedby={alertError ? 'target-price-alert-error' : 'target-price-alert-help'}
                  className={`w-full rounded-lg border px-4 py-2.5 focus:ring-2 focus:ring-emerald-400 focus:border-transparent ${
                    alertError ? 'border-pf-danger-line bg-pf-danger-bg' : 'border-pf-line-strong'
                  }`}
                />
                <p id="target-price-alert-help" className="text-xs text-pf-muted mt-1">
                  Current: ${priceAlertProduct.price.toFixed(2)}/{displayUnit(priceAlertProduct.unit)}. Choose a lower target above $0.
                </p>
              </div>
              {alertError && (
                <p id="target-price-alert-error" className="rounded-lg border border-pf-danger-line bg-pf-danger-bg px-3 py-2 text-sm text-pf-danger">
                  {alertError}
                </p>
              )}
            </div>

            <div className="mt-4 border-t border-pf-line pt-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPriceAlertModal(false)}
                className="px-4 py-2 text-pf-secondary hover:bg-pf-surface rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={savePriceAlert}
                className="px-4 py-2 bg-emerald-500 text-[#032116] rounded-lg hover:bg-emerald-400 transition-colors"
              >
                Save alert
              </button>
            </div>
          </div>
        </Modal>
      )}

      {requestPricingProduct && createPortal(
        <div
          className="pf-dialog-backdrop-in fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeRequestPricingModal();
          }}
        >
          <div
            ref={requestPricingModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalog-message-title"
            tabIndex={-1}
            className="pf-dialog-panel-in flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-pf-line bg-pf-surface shadow-2xl"
          >
            <div className="shrink-0 px-4 py-3 border-b border-pf-line flex items-center justify-between bg-pf-canvas">
              <div>
                <h2 id="catalog-message-title" className="text-lg font-bold text-pf-text">
                  {requestPricingMode === 'REQUEST_PRICING' ? 'Request pricing' : 'Message grower'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeRequestPricingModal}
                className="p-2 text-pf-muted hover:text-pf-text hover:bg-pf-raised rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
                aria-label="Close message dialog"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-3">
              <div className="space-y-1 text-sm text-pf-secondary">
                <span className="block break-words font-semibold">{requestPricingProduct.name}</span>
                <span className="block break-words text-pf-accent">To: {requestPricingProduct.grower.businessName}</span>
              </div>

              <div>
                <p className="sr-only">Message templates</p>
                <div className="flex flex-wrap gap-2">
                  {MESSAGE_TEMPLATE_CHIPS.map((template) => (
                    <button
                      key={template.label}
                      aria-label={template.label}
                      type="button"
                      onClick={() => {
                        setRequestPricingMessage(template.getMessage(requestPricingProduct));
                        setRequestPricingError('');
                        requestPricingTextareaRef.current?.focus();
                      }}
                      className="min-h-10 rounded-full border border-pf-line px-3 py-2 text-xs font-semibold text-pf-secondary transition-colors hover:border-pf-accent-line hover:bg-pf-accent-bg hover:text-pf-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
                    >
                      {template.label === 'Pricing & MOQ' ? 'Pricing' : template.label === 'Introduction' ? 'Intro' : template.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="catalog-message-body" className="block text-sm font-medium text-pf-secondary">
                    Message
                  </label>
                  <span className={`text-xs ${requestPricingMessage.length > PRICING_MESSAGE_MAX_LENGTH - 60 ? 'text-pf-warning' : 'text-pf-muted'}`}>
                    {requestPricingMessage.length}/{PRICING_MESSAGE_MAX_LENGTH}
                  </span>
                </div>
                <textarea
                  id="catalog-message-body"
                  ref={requestPricingTextareaRef}
                  value={requestPricingMessage}
                  onChange={(e) => {
                    setRequestPricingMessage(e.target.value);
                    setRequestPricingError('');
                  }}
                  rows={5}
                  maxLength={PRICING_MESSAGE_MAX_LENGTH}
                  className="w-full rounded-lg border border-pf-line-strong px-4 py-3 text-base focus:border-transparent focus:ring-2 focus:ring-emerald-400"
                  placeholder="Write your message..."
                />
              </div>

              <div className="flex gap-2 text-xs text-pf-muted">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p>Replies in Messages.</p>
              </div>

              {requestPricingError && (
                <p className="text-sm text-pf-danger">{requestPricingError}</p>
              )}
            </div>

            <div className="shrink-0 px-4 py-3 border-t border-pf-line flex justify-end gap-3">
              <button
                type="button"
                onClick={closeRequestPricingModal}
                className="px-4 py-2 text-pf-secondary hover:bg-pf-surface rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={sendPricingMessage}
                disabled={requestPricingSending || !requestPricingMessage.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-[#032116] transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
              >
                {requestPricingSending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {requestPricingSending ? 'Sending...' : 'Send message'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Mobile Filter Sheet */}
      <MobileFilterSheet
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        filters={filters}
        onFilterChange={setFilters}
        activeFilterCount={activeFilterCount}
        productTypeCounts={productTypeCounts}
        resultCount={showFavoritesOnly ? visibleProductCount : totalProducts}
        showFavoritesOnly={showFavoritesOnly}
        favoriteCount={favorites.length}
        onFavoritesOnlyChange={setShowFavoritesOnly}
        savedFilters={savedFilters}
        onApplySavedFilter={(id) => {
          const saved = savedFilters.find(filter => filter.id === id);
          if (saved) applySavedFilter(saved);
          setShowMobileFilters(false);
        }}
        onDeleteSavedFilter={deleteSavedFilter}
        onSaveFilter={openSaveFilterModal}
        hasSearchOrSort={Boolean(searchQuery) || sortBy !== 'default'}
      />
    </div>
  );
}

function CatalogSkeletonGrid({ viewMode }: { viewMode: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <div className="space-y-3" aria-label="Loading catalog products">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="animate-pulse rounded-lg border border-pf-line bg-pf-surface p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden h-8 w-8 shrink-0 rounded-lg bg-pf-raised sm:block" />
              <div className="hidden h-8 w-8 shrink-0 rounded-lg bg-pf-raised sm:block" />
              <div className="h-12 w-12 shrink-0 rounded-lg bg-pf-raised sm:h-16 sm:w-16" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-48 max-w-full rounded bg-pf-raised" />
                <div className="h-3 w-72 max-w-full rounded bg-pf-raised" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 rounded-full bg-pf-raised" />
                  <div className="h-5 w-20 rounded-full bg-pf-raised" />
                </div>
              </div>
              <div className="hidden h-9 w-24 rounded-lg bg-pf-raised md:block" />
              <div className="hidden h-10 w-24 shrink-0 rounded-lg bg-pf-raised sm:block" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8" aria-label="Loading catalog products">
      <div className="overflow-hidden rounded-xl border border-pf-line bg-pf-surface shadow-sm">
        <div className="border-b border-pf-line bg-pf-canvas px-6 py-4">
          <div className="h-5 w-40 animate-pulse rounded bg-pf-raised" />
          <div className="mt-2 h-3 w-24 animate-pulse rounded bg-pf-raised" />
        </div>
        <div className="grid grid-cols-1 gap-4 p-3 sm:p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="animate-pulse overflow-hidden rounded-xl border border-pf-line bg-pf-surface">
              <div className="h-24 bg-pf-raised sm:h-40" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 rounded bg-pf-raised" />
                <div className="h-3 w-1/2 rounded bg-pf-raised" />
                <div className="flex gap-2">
                  <div className="h-5 w-14 rounded-full bg-pf-raised" />
                  <div className="h-5 w-16 rounded-full bg-pf-raised" />
                  <div className="h-5 w-20 rounded-full bg-pf-raised" />
                </div>
                <div className="h-8 w-full rounded-lg bg-pf-raised" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
// ============================================
// COMPARE MODAL COMPONENT
// ============================================
function CompareModal({
  products,
  onClose,
  onRemove,
  onClear,
  onRequestPricing,
  onMessageGrower,
}: {
  products: Product[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onRequestPricing: (product: Product) => void;
  onMessageGrower: (product: Product) => void;
}) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const unitsInComparison = useMemo(
    () => Array.from(new Set(products.map((product) => displayUnit(product.unit)))),
    [products]
  );
  const hasDifferentUnits = unitsInComparison.length > 1;

  useBodyOverlay(true);

  useFocusTrap({
    active: true,
    containerRef: modalRef,
    initialFocusRef: closeButtonRef,
    onEscape: onClose,
  });


  const comparisonAttributes = [
    { label: 'Price', key: 'price', format: (p: Product) => p.isPriceVisible ? `\$${p.price.toFixed(2)} / ${displayUnit(p.unit)}` : 'Request pricing' },
    { label: 'THC', key: 'thc', format: (p: Product) => p.thc !== null ? `${p.thc}%` : 'N/A' },
    { label: 'CBD', key: 'cbd', format: (p: Product) => p.cbd !== null ? `${p.cbd}%` : 'N/A' },
    { label: 'Strain Type', key: 'strainType', format: (p: Product) => getDisplayStrainType(p) || 'N/A' },
    { label: 'Strain', key: 'strain', format: (p: Product) => p.strain || 'N/A' },
    { label: 'Product Type', key: 'productType', format: (p: Product) => p.productType || 'N/A' },
    { label: 'Unit', key: 'unit', format: (p: Product) => displayUnit(p.unit) },
    { label: 'Stock', key: 'inventoryQty', format: (p: Product) => `${p.inventoryQty} ${displayUnit(p.unit)}` },
    { label: 'Grower', key: 'grower', format: (p: Product) => p.grower.businessName },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="catalog-compare-title" tabIndex={-1} className="flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-pf-line bg-pf-surface shadow-xl">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-pf-line px-4 py-3">
          <h2 id="catalog-compare-title" className="text-lg font-semibold">Compare ({products.length})</h2>
          <div className="flex items-center gap-1">
            <button type="button" onClick={onClear} className="min-h-10 px-3 text-sm text-pf-danger">Clear</button>
            <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close product comparison" className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-pf-surface"><X size={20} /></button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {hasDifferentUnits && <p className="mb-3 rounded-lg bg-pf-warning-bg p-2 text-xs text-pf-warning sm:text-sm">Units differ; confirm with the grower.</p>}
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${products.length}, minmax(0, 1fr))` }}>
            {products.map(product => <div key={product.id} className="min-w-0">
              <div className="mb-2 flex items-center justify-between gap-1">
                <div className="h-12 w-12 overflow-hidden rounded-lg"><ProductImage src={product.images?.[0]} alt={product.name} productType={product.productType} className="h-full w-full" /></div>
                <button type="button" onClick={() => onRemove(product.id)} aria-label={`Remove ${product.name} from comparison`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-pf-muted hover:bg-pf-surface"><X size={18} /></button>
              </div>
              <h3 className="break-words text-sm font-semibold sm:text-base">{product.name}</h3>
              <Link href={`/dispensary/grower/${product.grower.id}`} className="mt-1 inline-block text-xs text-pf-accent hover:underline">{product.grower.businessName}</Link>
              <LabReportDownloads productId={product.id} productName={product.name} reports={product.labReports} className="mt-2" />
            </div>)}
          </div>
          <div className="mt-4 divide-y divide-pf-line border-t border-pf-line">
            {comparisonAttributes.filter(attribute => attribute.key !== 'grower').map(attribute => <div key={attribute.key} className="py-2 sm:py-3">
              <p className="mb-1 text-xs font-medium text-pf-muted">{attribute.label}</p>
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${products.length}, minmax(0, 1fr))` }}>
                {products.map(product => <p key={product.id} className={`break-words text-sm font-medium ${attribute.key === 'price' ? 'text-pf-accent' : 'text-pf-text'}`}>{attribute.format(product)}</p>)}
              </div>
            </div>)}
          </div>
          <div className="mt-4 space-y-2 border-t border-pf-line pt-3">
            {products.map(product => <div key={product.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-pf-canvas px-3 py-2">
              <p className="min-w-0 flex-1 break-words text-sm font-medium">{product.name}</p>
              <div className="flex shrink-0 items-center gap-2">
                {product.isPriceVisible ? <AddToCartButton product={product} growerName={product.grower.businessName} growerId={product.grower.id} compact compactLabel="Add" /> : <button type="button" onClick={() => onRequestPricing(product)} className="min-h-10 rounded-lg border border-pf-accent-line bg-pf-accent-bg px-2 text-sm text-pf-accent">Request pricing</button>}
                <button type="button" onClick={() => onMessageGrower(product)} className="min-h-10 px-1 text-sm text-pf-accent">Message</button>
              </div>
            </div>)}
          </div>
          {products.some(product => product.isPriceVisible) && <details className="mt-4 rounded-lg border border-pf-line p-3">
            <summary className="min-h-10 cursor-pointer content-center text-sm font-medium text-pf-accent">Choose quantities</summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {products.filter(product => product.isPriceVisible).map(product => <div key={product.id} className="min-w-0 rounded-lg bg-pf-canvas p-3"><h3 className="mb-3 text-sm font-semibold">{product.name}</h3><AddToCartButton product={product} growerName={product.grower.businessName} growerId={product.grower.id} /></div>)}
            </div>
          </details>}
          {!hasDifferentUnits && products.filter(product => product.isPriceVisible).length >= 2 && <details className="mt-3 rounded-lg border border-pf-line p-3">
            <summary className="min-h-10 cursor-pointer content-center text-sm font-medium text-pf-accent">Price chart</summary>
            <div className="mt-3 space-y-3">{products.filter(product => product.isPriceVisible).map(product => <div key={product.id}>
              <p className="mb-1 flex justify-between gap-3 text-sm"><span>{product.name}</span><span>${product.price.toFixed(2)}/{displayUnit(product.unit)}</span></p>
              <div className="h-3 overflow-hidden rounded bg-pf-surface"><div className="h-full bg-emerald-500" style={{ width: `${Math.max(...products.filter(item => item.isPriceVisible).map(item => item.price)) > 0 ? product.price / Math.max(...products.filter(item => item.isPriceVisible).map(item => item.price)) * 100 : 0}%` }} /></div>
            </div>)}</div>
          </details>}
        </div>
      </div>
    </div>, document.body
  );
}

function groupByGrower(products: Product[]) {
  const groupsMap = new Map<string, { growerId: string; growerName: string; products: Product[] }>();

  products.forEach((product) => {
    const existingGroup = groupsMap.get(product.grower.id);
    if (existingGroup) {
      existingGroup.products.push(product);
      return;
    }

    groupsMap.set(product.grower.id, {
      growerId: product.grower.id,
      growerName: product.grower.businessName,
      products: [product],
    });
  });

  return Array.from(groupsMap.values());
}

// ============== END PRICE ALERT FUNCTIONS ==================

// ============================================
// ENHANCED PRODUCT CARD COMPONENT (Grid View)
function ProductCard({
  product,
  isInCompare,
  onCompareToggle,
  compareDisabled,
  isFav,
  onFavoriteToggle,
  hasAlert,
  onAlertToggle,
  onRequestPricing,
  onMessageGrower,
  isHighlighted,
}: {
  product: Product;
  isInCompare: boolean;
  onCompareToggle: () => void;
  compareDisabled: boolean;
  isFav: boolean;
  onFavoriteToggle: () => void;
  hasAlert?: boolean;
  onAlertToggle?: () => void;
  onRequestPricing: () => void;
  onMessageGrower: () => void;
  isHighlighted: boolean;
}) {
  const [imageHovered, setImageHovered] = useState(false);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setImagePosition({ x, y });
  };

  const strainType = product.strainType || (product.strain ?
    (product.strain.toLowerCase().includes('indica') ? 'Indica' :
     product.strain.toLowerCase().includes('sativa') ? 'Sativa' : 'Hybrid') : null);


  return (
    <div
      id={`catalog-product-${product.id}`}
      className={`scroll-mt-24 grid grid-cols-[64px_minmax(0,1fr)] gap-x-3 p-3 sm:block sm:p-0 border border-pf-line rounded-xl overflow-hidden hover:border-pf-line-strong transition-colors bg-pf-surface group ${
        isHighlighted ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-pf-canvas shadow-lg' : ''
      }`}
    >
      {/* Product Image with Zoom */}
      <div
        className={`relative h-16 overflow-hidden rounded-lg bg-pf-raised sm:h-40 sm:rounded-none ${product.images?.[0] ? 'cursor-crosshair' : ''}`}
        onMouseEnter={() => setImageHovered(true)}
        onMouseLeave={() => setImageHovered(false)}
        onMouseMove={handleMouseMove}
      >
        {/* Favorite Button */}
        <div className={`absolute top-2 z-10 hidden sm:block ${product.isPriceVisible ? 'right-12' : 'right-2'}`}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle();
            }}
                className={`min-h-10 min-w-10 p-2 rounded-lg transition-all ${
              isFav
                ? "bg-pf-danger-bg text-pf-danger shadow-md"
                : "bg-pf-surface/95 backdrop-blur-sm text-pf-muted hover:text-pf-danger hover:bg-pf-surface shadow-sm"
            }`}
            title={isFav ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart size={16} fill={isFav ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Price Alert Button */}
        {product.isPriceVisible && (
          <div className="absolute top-2 right-2 z-10 hidden sm:block">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAlertToggle?.();
              }}
                  className={`min-h-10 min-w-10 p-2 rounded-lg transition-all ${
                hasAlert
                  ? 'bg-pf-warning-bg text-pf-warning shadow-md'
                  : 'bg-pf-surface/95 backdrop-blur-sm text-pf-muted hover:text-pf-warning hover:bg-pf-surface shadow-sm'
              }`}
              title={hasAlert ? 'Price alert set' : 'Set price alert'}
            >
              {hasAlert ? <BellRing size={16} /> : <Bell size={16} />}
            </button>
          </div>
        )}

        {/* Product Image or Placeholder */}
        <ProductImage
          src={product.images?.[0]}
          alt={product.name}
          productType={product.productType}
          className="h-full w-full"
          imageClassName="transition-transform duration-300"
          imageStyle={{
            transform: imageHovered ? 'scale(1.5)' : 'scale(1)',
            transformOrigin: `${imagePosition.x}% ${imagePosition.y}%`,
          }}
        />

        {/* Magnify Overlay on Hover */}
        <div className={`absolute inset-0 bg-black/10 flex items-center justify-center transition-all duration-300 ${imageHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-pf-surface/95 backdrop-blur-sm rounded-full p-2 shadow-lg transform scale-110">
            <ZoomIn className="h-5 w-5 text-pf-secondary" aria-hidden="true" />
          </div>
        </div>


      </div>

      <div className="contents sm:block sm:p-4">
        <div className="min-w-0">
        {/* Product Name */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="break-words text-sm font-semibold text-pf-text flex-1 sm:text-base">{product.name}</h3>
          {product.grower.isVerified && (
            <span className="text-pf-accent" title="Verified Grower">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </span>
          )}
        </div>

        {/* Product facts share a wrapping row. */}
        <div className="flex flex-wrap gap-1.5 mb-2 sm:gap-2 sm:mb-3">
          {strainType && <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${getStrainTypeColor(strainType, 'card', product.strain)}`}>{strainType}</span>}
          {product.thc != null && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getThcBadgeColor(product.thc)} flex items-center gap-1`}>
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z"/>
              </svg>
              THC {product.thc}%
            </span>
          )}
          {product.cbd != null && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getCbdBadgeColor(product.cbd)} flex items-center gap-1`}>
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-2 2A1 1 0 004 11v5a1 1 0 001 1h10a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0013 8.171V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a4 4 0 00-2.17-.102l1.027-1.028A3 3 0 009 8.172z" clipRule="evenodd"/>
              </svg>
              CBD {product.cbd}%
            </span>
          )}
          {product.productType && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-pf-surface text-pf-secondary border border-pf-line">
              {product.productType}
            </span>
          )}
        </div>

        {/* Strain & Unit Info */}
        <div className="mb-3 text-sm text-pf-muted">
          {product.strain && !product.strain.toLowerCase().includes('indica') && !product.strain.toLowerCase().includes('sativa') && !product.strain.toLowerCase().includes('hybrid') && (
            <p className="mb-1">
              <span className="text-pf-muted">Strain:</span> {product.strain}
            </p>
          )}
          {!product.isPriceVisible && <p className="text-xs text-pf-muted">{product.inventoryQty} available</p>}
        </div>

        </div>
        {/* Price & Action */}
        <div className="col-span-2 pt-2 border-t border-pf-line space-y-2 sm:pt-3">
          {product.isPriceVisible ? (
            <div className="space-y-3">
              <div>
                <span className="text-xl font-bold text-pf-accent">${product.price.toFixed(2)}</span>
                <span className="text-sm text-pf-muted ml-1">/ {displayUnit(product.unit)}</span>
              </div>
              <AddToCartButton
                product={product}
                growerName={product.grower.businessName}
                growerId={product.grower.id}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={onRequestPricing}
              className="min-h-10 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-pf-accent-line bg-pf-accent-bg px-3 py-2 text-sm font-medium text-pf-accent hover:bg-pf-accent-bg"
            >
              Request pricing
            </button>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2 text-sm sm:gap-3">
            <button type="button" aria-label={isFav ? `Remove ${product.name} from favorites` : `Favorite ${product.name}`} onClick={onFavoriteToggle} className={`flex h-10 w-10 items-center justify-center rounded-lg sm:hidden ${isFav ? 'bg-pf-danger-bg text-pf-danger' : 'text-pf-muted'}`}><Heart size={18} fill={isFav ? 'currentColor' : 'none'} /></button>
            {product.isPriceVisible && <button type="button" aria-label={`Price alert for ${product.name}`} onClick={onAlertToggle} className="flex h-10 w-10 items-center justify-center rounded-lg text-pf-warning sm:hidden">{hasAlert ? <BellRing size={18} /> : <Bell size={18} />}</button>}
            <button
              type="button"
              onClick={onMessageGrower}
              aria-label="Message grower"
              className="inline-flex min-h-10 items-center font-medium text-pf-accent hover:text-pf-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
            >
              <span className="sm:hidden">Message</span><span className="hidden sm:inline">Message grower</span>
            </button>
            <span className="hidden text-pf-secondary sm:inline" aria-hidden="true">•</span>
            <button
              type="button"
              aria-label={isInCompare ? `Remove ${product.name} from comparison` : `Compare ${product.name}`}
            onClick={onCompareToggle}
              disabled={compareDisabled && !isInCompare}
              className="min-h-10 font-medium text-pf-muted hover:text-pf-text hover:underline disabled:cursor-not-allowed disabled:text-pf-secondary disabled:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
            >
              {isInCompare ? 'Remove compare' : 'Compare'}
            </button>
          </div>
        </div>

        <LabReportDownloads productId={product.id} productName={product.name} reports={product.labReports} className="col-span-2 mt-2" />
      </div>
    </div>
  );
}

// ============================================
// ENHANCED PRODUCT LIST ITEM (List View)
function ProductListItem({
  product,
  isInCompare,
  onCompareToggle,
  compareDisabled,
  isFav,
  onFavoriteToggle,
  hasAlert,
  onAlertToggle,
  onRequestPricing,
  onMessageGrower,
  isHighlighted,
}: {
  product: Product;
  isInCompare: boolean;
  onCompareToggle: () => void;
  compareDisabled: boolean;
  isFav: boolean;
  onFavoriteToggle: () => void;
  hasAlert?: boolean;
  onAlertToggle?: () => void;
  onRequestPricing: () => void;
  onMessageGrower: () => void;
  isHighlighted: boolean;
}) {
  const strainType = getDisplayStrainType(product);
  return (
    <article id={`catalog-product-${product.id}`} data-product-row className={`scroll-mt-24 grid grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-xl border border-pf-line bg-pf-surface p-3 sm:p-4 lg:flex lg:items-center lg:gap-4 ${isHighlighted ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-pf-canvas' : ''}`}>
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-pf-raised">
        <ProductImage src={product.images?.[0]} alt={product.name} productType={product.productType} className="h-full w-full" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="flex items-start gap-2 font-semibold text-pf-text">{product.name}{product.grower.isVerified && <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-pf-accent" aria-label="Verified grower" />}</h3>
        <p className="mt-1 text-sm text-pf-muted">{[product.strain, product.productType, product.subType].filter(Boolean).join(' · ')}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {strainType && <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStrainTypeColor(strainType, 'row')}`}>{strainType}</span>}
          {product.thc != null && <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getThcBadgeColor(product.thc, 'compact')}`}>THC {product.thc}%</span>}
          <span className="text-xs text-pf-muted">{product.inventoryQty} available</span>
        </div>
        <LabReportDownloads productId={product.id} productName={product.name} reports={product.labReports} className="mt-2" />
      </div>
      <div className="col-span-2 flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-pf-line pt-3 lg:w-56 lg:shrink-0 lg:border-0 lg:pt-0">
        {product.isPriceVisible ? <>
          <span data-product-price className="whitespace-nowrap text-lg font-bold text-pf-accent">${product.price.toFixed(2)}<span className="ml-1 text-sm font-normal text-pf-muted">/{displayUnit(product.unit)}</span></span>
          <AddToCartButton product={product} growerName={product.grower.businessName} growerId={product.grower.id} compact compactLabel="Add" />
        </> : <button type="button" onClick={onRequestPricing} className="min-h-10 w-full rounded-lg border border-pf-accent-line bg-pf-accent-bg px-3 py-2 text-sm font-medium text-pf-accent hover:bg-pf-accent-bg">Request pricing</button>}
        <div className="flex w-full flex-wrap items-center gap-2 text-sm">
          <button type="button" aria-label={isFav ? `Remove ${product.name} from favorites` : `Favorite ${product.name}`} onClick={onFavoriteToggle} className={`flex h-10 w-10 items-center justify-center rounded-lg ${isFav ? 'bg-pf-danger-bg text-pf-danger' : 'text-pf-muted hover:bg-pf-surface'}`}><Heart size={18} fill={isFav ? 'currentColor' : 'none'} /></button>
          {product.isPriceVisible && <button type="button" aria-label={`Price alert for ${product.name}`} onClick={onAlertToggle} className="flex h-10 w-10 items-center justify-center rounded-lg text-pf-warning hover:bg-pf-warning-bg">{hasAlert ? <BellRing size={18} /> : <Bell size={18} />}</button>}
          <button type="button" onClick={onMessageGrower} className="min-h-10 font-medium text-pf-accent hover:underline">Message</button>
          <button type="button" aria-label={isInCompare ? `Remove ${product.name} from comparison` : `Compare ${product.name}`} onClick={onCompareToggle} disabled={compareDisabled && !isInCompare} className="min-h-10 font-medium text-pf-muted hover:underline disabled:opacity-40">{isInCompare ? 'Remove compare' : 'Compare'}</button>
        </div>
      </div>
    </article>
  );
}
