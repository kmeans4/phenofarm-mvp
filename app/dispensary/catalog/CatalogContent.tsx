'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from "next/link";
import { LayoutGrid, List as ListIcon, SlidersHorizontal, X, ArrowUpDown, FileText, Loader2, Clock, TrendingUp, Search, MapPin, Scale, Check, Plus, BarChart3, AlertCircle } from "lucide-react";
import { Bookmark, BookmarkCheck, Heart, Bell, BellRing } from "lucide-react";
import AddToCartButton from "./components/AddToCartButton";
import CartBadge from "./components/CartBadge";
import MobileFilterSheet from "./components/MobileFilterSheet";

interface Product {
  id: string;
  name: string;
  price: number;
  strain: string | null;
  strainId: string | null;
  strainType: string | null;
  productType: string | null;
  subType: string | null;
  unit: string | null;
  thc: number | null;
  cbd: number | null;
  images: string[];
  inventoryQty: number;
  createdAt?: string;
  grower: {
    id: string;
    businessName: string;
    location?: string | null;
    isVerified?: boolean;
  };
}

interface FilterState {
  productTypes: string[];
  thcRanges: string[];
  priceRanges: string[];
  recentlyAdded: boolean;
  trending: boolean;
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

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'thc-asc' | 'thc-desc' | 'name-asc' | 'name-desc';

const PRODUCT_TYPES = ['Flower', 'Edibles', 'Cartridge', 'Concentrate', 'Pre-roll', 'Tincture', 'Topical', 'Drink'];

const THC_RANGES = [
  { label: '< 15%', min: 0, max: 15, id: 'low' },
  { label: '15% - 20%', min: 15, max: 20, id: 'medium' },
  { label: '20% - 25%', min: 20, max: 25, id: 'high' },
  { label: '25%+', min: 25, max: 100, id: 'very-high' },
];

const PRICE_RANGES = [
  { label: 'Under $5', min: 0, max: 5, id: 'budget' },
  { label: '$5 - $10', min: 5, max: 10, id: 'standard' },
  { label: '$10 - $25', min: 10, max: 25, id: 'premium' },
  { label: '$25+', min: 25, max: 10000, id: 'luxury' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Default (Grower)' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'thc-desc', label: 'THC: High to Low' },
  { value: 'thc-asc', label: 'THC: Low to High' },
  { value: 'name-asc', label: 'Name: A-Z' },
  { value: 'name-desc', label: 'Name: Z-A' },
];

const ITEMS_PER_PAGE = 20;
const RECENT_SEARCHES_KEY = 'phenofarm_recent_searches';
const MAX_RECENT_SEARCHES = 5;
const MAX_COMPARE_ITEMS = 3;
const COMPARE_STORAGE_KEY = 'phenofarm_compare_products';
const SAVED_FILTERS_KEY = 'phenofarm_saved_filters';
const FAVORITES_KEY = 'phenofarm_favorites';
const PRICE_ALERTS_KEY = 'phenofarm_price_alerts';
const MAX_PRICE_ALERTS = 20;
const MAX_SAVED_FILTERS = 5;

export default function CatalogContent() {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [filters, setFilters] = useState<FilterState>({
    productTypes: [],
    thcRanges: [],
    priceRanges: [],
    recentlyAdded: false,
    trending: false,
  });
  
  // Mobile filter sheet state
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Compare state
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showCompareBar, setShowCompareBar] = useState(true);  // Saved filters state
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<string[]>([]);
  const [showPriceAlertModal, setShowPriceAlertModal] = useState(false);
  const [priceAlertProduct, setPriceAlertProduct] = useState<Product | null>(null);
  const [targetPrice, setTargetPrice] = useState('');
  const [alertError, setAlertError] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showSaveFilterModal, setShowSaveFilterModal] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');

  
  // Search autocomplete state
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Infinite scroll state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  
  // Refs
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Load compare list from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COMPARE_STORAGE_KEY);
      if (stored) {
        setCompareList(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load compare list:', e);
    }
  }, []);

  // Save compare list to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareList));
    } catch (e) {
      console.error('Failed to save compare list:', e);
    }
  }, [compareList]);
  // Load saved filters from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAVED_FILTERS_KEY);
      if (stored) {
        setSavedFilters(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load saved filters:', e);
    }
  }, []);

  // Save saved filters to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(savedFilters));
    } catch (e) {
      console.error('Failed to save filters:', e);
    }
  }, [savedFilters]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load favorites:', e);
    }
  }, []);

  // Save favorites to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }
  }, [favorites]);

  // Toggle favorite status
  const toggleFavorite = useCallback((productId: string) => {
    setFavorites(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      }
      return [...prev, productId];
    });
  }, []);

  // Check if product is favorite
  const isFavorite = useCallback((productId: string) => {
    return favorites.includes(productId);
  }, [favorites]);

  // Load price alerts from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PRICE_ALERTS_KEY);
      if (stored) {
        const alerts = JSON.parse(stored);
        setPriceAlerts(alerts.map((a: any) => a.productId));
      }
    } catch (e) {
      console.error("Failed to load price alerts:", e);
    }
  }, []);

  // Check if product has price alert
  const hasPriceAlert = useCallback((productId: string) => {
    return priceAlerts.includes(productId);
  }, [priceAlerts]);



  // Add product to compare
  const addToCompare = useCallback((product: Product) => {
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
    setCompareList(prev => prev.filter(p => p.id !== productId));
  }, []);

  // Check if product is in compare list
  const isInCompareList = useCallback((productId: string) => {
    return compareList.some(p => p.id === productId);
  }, [compareList]);

  // Clear all compare items
  const clearCompare = useCallback(() => {
    setCompareList([]);
  }, []);
  // Save current filter configuration
  const saveCurrentFilter = useCallback(() => {
    if (!newFilterName.trim()) return;
    
    const hasActiveFilters = filters.productTypes.length > 0 || 
                             filters.thcRanges.length > 0 || 
                             filters.priceRanges.length > 0 ||
                             searchQuery ||
                             sortBy !== 'default';
    
    if (!hasActiveFilters) {
      alert('No active filters to save. Apply some filters first!');
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
    setShowSaveFilterModal(false);
  }, [filters, searchQuery, sortBy, newFilterName]);

  // Apply a saved filter
  const applySavedFilter = useCallback((savedFilter: SavedFilter) => {
    setFilters(savedFilter.filters);
    setSearchQuery(savedFilter.searchQuery);
    setSortBy(savedFilter.sortBy);
  }, []);

  // Delete a saved filter
  const deleteSavedFilter = useCallback((filterId: string) => {
    setSavedFilters(prev => prev.filter(f => f.id !== filterId));
  }, []);



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
    
    // Load popular searches
    fetchPopularSearches();
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

  // Fetch search suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/dispensary/search-suggestions?q=\${encodeURIComponent(query)}&limit=8`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setPopularSearches(data.popular || []);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Fetch popular searches
  const fetchPopularSearches = async () => {
    try {
      const response = await fetch('/api/dispensary/search-suggestions?q=');
      if (response.ok) {
        const data = await response.json();
        setPopularSearches(data.popular || []);
      }
    } catch (error) {
      console.error('Error fetching popular searches:', error);
    }
  };

  // Debounced search input handler
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(true);
    setHighlightedIndex(-1);
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 150);
  };

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
    const allItems = [
      ...suggestions,
      ...recentSearches.map(r => ({ text: r, type: 'recent' })),
      ...popularSearches.map(p => ({ text: p.text, type: 'popular' })),
    ].filter((item, index, self) => 
      index === self.findIndex(i => i.text === item.text)
    );
    
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

  // Fetch products from API
  const fetchProducts = useCallback(async (pageNum: number, append: boolean = false) => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams();
      params.set('page', pageNum.toString());
      params.set('limit', ITEMS_PER_PAGE.toString());
      
      if (searchQuery) params.set('search', searchQuery);
      if (filters.productTypes.length > 0) params.set('productTypes', filters.productTypes.join(','));
      if (filters.thcRanges.length > 0) params.set('thcRanges', filters.thcRanges.join(','));
      if (filters.priceRanges.length > 0) params.set('priceRanges', filters.priceRanges.join(','));
      if (sortBy !== 'default') params.set('sortBy', sortBy);
      if (filters.recentlyAdded) params.set('recentlyAdded', 'true');
      
      const response = await fetch(`/api/dispensary/catalog?\${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      
      if (append) {
        setProducts(prev => [...prev, ...data.products]);
      } else {
        setProducts(data.products);
      }
      
      setHasMore(data.hasMore);
      setTotalProducts(data.total);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [searchQuery, filters, sortBy, isLoading]);

  // Initial load
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      fetchProducts(1, false);
    }
  }, [fetchProducts]);

  // Refetch when filters/sort/search change
  useEffect(() => {
    if (!isFirstRender.current) {
      fetchProducts(1, false);
    }
  }, [searchQuery, filters.productTypes, filters.thcRanges, filters.priceRanges, filters.recentlyAdded, sortBy]);

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
  const filteredProducts = showFavoritesOnly
    ? products.filter(p => favorites.includes(p.id))
    : products;

  // Group products by grower when not sorting
  const groupedProducts = sortBy === 'default' 
    ? groupByGrower(filteredProducts)
    : [{ growerId: 'all', growerName: 'All Products', products: filteredProducts }];

  // Get active filter count
  const activeFilterCount = filters.productTypes.length + filters.thcRanges.length + filters.priceRanges.length + (filters.recentlyAdded ? 1 : 0) + (filters.trending ? 1 : 0) + (showFavoritesOnly ? 1 : 0);

  // Get active filter chips
  const getFilterChips = () => {
    const chips: { label: string; category: 'productTypes' | 'thcRanges' | 'priceRanges' | 'favorites' | 'recentlyAdded'; value: string }[] = [];
    if (showFavoritesOnly) {
      chips.push({ label: `Favorites (${favorites.length})`, category: 'favorites', value: 'favorites' });
    }
    if (filters.recentlyAdded) {
      chips.push({ label: 'Recently Added (7 days)', category: 'recentlyAdded', value: 'recentlyAdded' });
    }
    filters.productTypes.forEach(type => {
      chips.push({ label: type, category: 'productTypes', value: type });
    });
    filters.thcRanges.forEach(rangeId => {
      const range = THC_RANGES.find(r => r.id === rangeId);
      if (range) chips.push({ label: `THC: \${range.label}`, category: 'thcRanges', value: rangeId });
    });
    filters.priceRanges.forEach(rangeId => {
      const range = PRICE_RANGES.find(r => r.id === rangeId);
      if (range) chips.push({ label: `Price: \${range.label}`, category: 'priceRanges', value: rangeId });
    });
    return chips;
  };

  // Get icon for suggestion type
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'product': return <span className="text-green-600">🌿</span>;
      case 'strain': return <span className="text-purple-600">🧬</span>;
      case 'grower': return <MapPin size={16} className="text-blue-500" />;
      case 'category': return <LayoutGrid size={16} className="text-orange-500" />;
      case 'recent': return <Clock size={16} className="text-gray-400" />;
      case 'popular': return <TrendingUp size={16} className="text-red-500" />;
      default: return <Search size={16} className="text-gray-400" />;
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
    setPriceAlertProduct(product);
    setTargetPrice((product.price * 0.9).toFixed(2));
    setAlertError('');
    setShowPriceAlertModal(true);
  };

  const savePriceAlert = () => {
    if (!priceAlertProduct || !targetPrice) return;
    
    const target = parseFloat(targetPrice);
    if (isNaN(target) || target <= 0) {
      setAlertError('Please enter a valid price');
      return;
    }
    
    if (target >= priceAlertProduct.price) {
      setAlertError('Target price must be lower than current price');
      return;
    }
    
    const existingAlerts = JSON.parse(localStorage.getItem(PRICE_ALERTS_KEY) || '[]');
    
    if (existingAlerts.length >= MAX_PRICE_ALERTS) {
      setAlertError(`Maximum ${MAX_PRICE_ALERTS} alerts allowed. Remove some first.`);
      return;
    }
    
    const newAlert = {
      id: Date.now().toString(),
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
      createdAt: new Date().toISOString(),
      isTriggered: false,
    };
    
    const updated = [...existingAlerts, newAlert];
    localStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(updated));
    setPriceAlerts(prev => [...prev, priceAlertProduct.id]);
    setShowPriceAlertModal(false);
  };

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Catalog</h1>
          <p className="text-gray-600 mt-1">Browse products from verified growers</p>
        </div>
        <CartBadge />
      </div>

      {/* Search, Sort, and Controls Bar */}
      <div className="flex flex-col lg:flex-row gap-4 relative">
        {/* Search with Autocomplete */}
        <div className="flex-1 relative" ref={suggestionsRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by product, strain, grower, or type..."
              value={searchQuery}
              onChange={handleSearchInput}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg border border-gray-300 pl-10 pr-10 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
          
          {/* Autocomplete Dropdown */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
              {/* Loading State */}
              {isSearching && searchQuery.length >= 2 && (
                <div className="px-4 py-3 flex items-center gap-2 text-gray-500">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Searching...</span>
                </div>
              )}
              
              {/* Live Suggestions */}
              {suggestions.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Suggestions
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`suggestion-\${suggestion.text}-\${index}`}
                      onClick={() => handleSearchSubmit(suggestion.text)}
                      className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left \${
                        highlightedIndex === index ? 'bg-green-50' : ''
                      }`}
                    >
                      {getSuggestionIcon(suggestion.type)}
                      <span className="flex-1 text-sm text-gray-700">{suggestion.text}</span>
                      <span className="text-xs text-gray-400">{getSuggestionLabel(suggestion.type)}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="py-2 border-t border-gray-100">
                  <div className="px-4 py-1.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent</span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      Clear
                    </button>
                  </div>
                  {recentSearches.map((search, index) => (
                    <button
                      key={`recent-\${search}-\${index}`}
                      onClick={() => handleSearchSubmit(search)}
                      className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left \${
                        highlightedIndex === suggestions.length + index ? 'bg-green-50' : ''
                      }`}
                    >
                      <Clock size={16} className="text-gray-400" />
                      <span className="flex-1 text-sm text-gray-700">{search}</span>
                      <span className="text-xs text-gray-400">Recent</span>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Popular Searches */}
              {popularSearches.length > 0 && !searchQuery && (
                <div className="py-2 border-t border-gray-100">
                  <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Popular
                  </div>
                  {popularSearches.map((popular, index) => (
                    <button
                      key={`popular-\${popular.text}-\${index}`}
                      onClick={() => handleSearchSubmit(popular.text)}
                      className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left \${
                        highlightedIndex === suggestions.length + recentSearches.length + index ? 'bg-green-50' : ''
                      }`}
                    >
                      <TrendingUp size={16} className="text-red-500" />
                      <span className="flex-1 text-sm text-gray-700">{popular.text}</span>
                      <span className="text-xs text-gray-400">{getSuggestionLabel(popular.type)}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {/* No Results */}
              {searchQuery.length >= 2 && !isSearching && suggestions.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-500">
                  No suggestions found. Press Enter to search for &quot;{searchQuery}&quot;
                </div>
              )}
              
              {/* Empty State (no query) */}
              {!searchQuery && recentSearches.length === 0 && popularSearches.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-500">
                  Type to search products, strains, and growers...
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer text-sm"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                setShowMobileFilters(true);
              } else {
                setShowFilters(!showFilters);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors \${
              showFilters 
                ? 'bg-green-600 text-white border-green-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal size={18} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-white text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
          
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 flex items-center gap-2 transition-colors \${
                viewMode === 'grid' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              aria-label="Grid view"
              title="Grid view"
            >
              <LayoutGrid size={18} />
              <span className="hidden sm:inline text-sm">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 flex items-center gap-2 transition-colors \${
                viewMode === 'list' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
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
      {(getFilterChips().length > 0 || searchQuery || sortBy !== 'default') && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500 mr-2">Active:</span>
          {sortBy !== 'default' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full">
              {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
              <button onClick={() => setSortBy('default')} className="hover:text-purple-900">
                <X size={14} />
              </button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
              Search: &quot;{searchQuery}&quot;
              <button onClick={() => setSearchQuery('')} className="hover:text-blue-900">
                <X size={14} />
              </button>
            </span>
          )}
          {getFilterChips().map((chip, idx) => (
            <span 
              key={`\${chip.category}-\${chip.value}`}
              className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full"
            >
              {chip.label}
              <button 
                onClick={() => {
                  if (chip.category === "favorites") {
                    setShowFavoritesOnly(false);
                  } else if (chip.category === "recentlyAdded") {
                    setFilters(prev => ({ ...prev, recentlyAdded: false }));
                  } else {
                    toggleFilter(chip.category as 'productTypes' | 'thcRanges' | 'priceRanges', chip.value);
                  }
                }}
                className="hover:text-green-900"
              >
                <X size={14} />
              </button>
            </span>
          ))}
          {(getFilterChips().length > 0 || searchQuery || sortBy !== 'default') && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline ml-2"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{isInitialLoading ? 'Loading...' : `\${products.length} of \${totalProducts} product\${totalProducts !== 1 ? 's' : ''}`}</span>
        <span className="text-xs text-gray-500">View: {viewMode === 'grid' ? 'Grid' : 'List'}{sortBy !== 'default' && ` • Sorted: \${SORT_OPTIONS.find(o => o.value === sortBy)?.label}`}</span>
      </div>

      {/* Main Content Area */}
      <div className="flex gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-64 flex-shrink-0 space-y-6">
            {/* Saved Filters Section */}
            {savedFilters.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <BookmarkCheck size={18} className="text-green-600" />
                  Saved Filters
                </h3>
                <div className="space-y-2">
                  {savedFilters.map(savedFilter => (
                    <div key={savedFilter.id} className="group">
                      <button
                        onClick={() => applySavedFilter(savedFilter)}
                        className="w-full text-left px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-between"
                      >
                        <span className="font-medium truncate">{savedFilter.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSavedFilter(savedFilter.id);
                          }}
                          className="text-green-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save Filter Button */}
            {(filters.productTypes.length > 0 || filters.thcRanges.length > 0 || filters.priceRanges.length > 0 || searchQuery || sortBy !== 'default') && (
              <button
                onClick={() => setShowSaveFilterModal(true)}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Bookmark size={16} />
                Save Current Filter
              </button>
            )}

            {/* Favorites Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Heart size={18} className="text-red-500" />
                Favorites
              </h3>
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${
                  showFavoritesOnly 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="font-medium">
                  {showFavoritesOnly ? 'Showing Favorites Only' : 'View Favorites Only'}
                </span>
                <span className="text-xs bg-white text-gray-600 px-2 py-1 rounded-full border border-gray-200">
                  {favorites.length} items
                </span>
              </button>
            </div>

            {/* Recently Added Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock size={18} className="text-green-600" />
                Recently Added
              </h3>
              <button
                onClick={() => setFilters(prev => ({ ...prev, recentlyAdded: !prev.recentlyAdded }))}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${
                  filters.recentlyAdded 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="font-medium">
                  {filters.recentlyAdded ? 'Recently Added (7 days)' : 'Show Recently Added'}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full border ${
                  filters.recentlyAdded 
                    ? 'bg-white text-green-700 border-green-200' 
                    : 'bg-white text-gray-600 border-gray-200'
                }`}>
                  {filters.recentlyAdded ? 'Active' : '7 days'}
                </span>
              </button>
            </div>

            {/* Product Type Filter */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Product Type</h3>
              <div className="space-y-2">
                {PRODUCT_TYPES.map(type => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={filters.productTypes.includes(type)}
                      onChange={() => toggleFilter('productTypes', type)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* THC Range Filter */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">THC Potency</h3>
              <div className="space-y-2">
                {THC_RANGES.map(range => (
                  <label key={range.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={filters.thcRanges.includes(range.id)}
                      onChange={() => toggleFilter('thcRanges', range.id)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">{range.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
              <div className="space-y-2">
                {PRICE_RANGES.map(range => (
                  <label key={range.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={filters.priceRanges.includes(range.id)}
                      onChange={() => toggleFilter('priceRanges', range.id)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">{range.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clear All Button */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="w-full py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Product Grid/List */}
        <div className="flex-1 min-w-0">
          {isInitialLoading ? (
            // Initial loading state
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading products...</p>
            </div>
          ) : groupedProducts.length > 0 ? (
            <div className="space-y-8">
              {groupedProducts.map(group => (
                <div key={group.growerId} className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden \${sortBy !== 'default' ? 'border-green-200 ring-1 ring-green-100' : ''}`}>
                  <div className={`px-6 py-4 border-b border-gray-200 \${sortBy !== 'default' ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {group.growerName}
                          {sortBy !== 'default' && (
                            <span className="ml-2 text-sm font-normal text-green-700">
                              (sorted by {SORT_OPTIONS.find(o => o.value === sortBy)?.label.toLowerCase()})
                            </span>
                          )}
                        </h2>
                        <p className="text-sm text-gray-500">{group.products.length} products</p>
                      </div>
                      {group.growerId !== 'all' && (
                        <Link 
                          href={`/dispensary/grower/\${group.growerId}`}
                          className="text-sm text-green-600 hover:text-green-700 font-medium"
                        >
                          View Shop →
                        </Link>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {viewMode === 'grid' ? (
                      /* Grid View */
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Infinite Scroll Loading Indicator */}
              <div ref={loadMoreRef} className="py-8">
                {isLoading && hasMore && (
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-green-600 animate-spin mb-2" />
                    <p className="text-sm text-gray-500">Loading more products...</p>
                  </div>
                )}
                {!hasMore && products.length > 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">You&apos;ve reached the end • {totalProducts} products total</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters, search, or sort criteria</p>
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Compare Bar - Floating at bottom */}
      {compareList.length > 0 && showCompareBar && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900">
                Compare ({compareList.length}/{MAX_COMPARE_ITEMS})
              </span>
            </div>
            
            <div className="flex-1 flex gap-2 overflow-x-auto">
              {compareList.map(product => (
                <div 
                  key={product.id} 
                  className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 min-w-fit"
                >
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center text-sm">
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0]} alt="" className="w-full h-full object-cover rounded" />
                    ) : (
                      <span className="opacity-50">🌿</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                    {product.name}
                  </span>
                  <button
                    onClick={() => removeFromCompare(product.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCompareModal(true)}
                disabled={compareList.length < 2}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BarChart3 size={18} />
                Compare Now
              </button>
              <button
                onClick={clearCompare}
                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Clear all"
              >
                <X size={20} />
              </button>
              <button
                onClick={() => setShowCompareBar(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
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
          onRemove={removeFromCompare}
          onClear={clearCompare}
        />
      )}
      {/* Save Filter Modal */}
      {showSaveFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Bookmark className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Save Filter</h2>
              </div>
              <button
                onClick={() => setShowSaveFilterModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter Name
                </label>
                <input
                  type="text"
                  value={newFilterName}
                  onChange={(e) => setNewFilterName(e.target.value)}
                  placeholder="e.g., High THC Flower Under $20"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              </div>
              
              {/* Preview of what will be saved */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">This filter includes:</p>
                <div className="flex flex-wrap gap-2">
                  {filters.productTypes.map(type => (
                    <span key={type} className="px-2 py-1 bg-white text-gray-700 text-xs rounded border border-gray-200">
                      {type}
                    </span>
                  ))}
                  {filters.thcRanges.map(rangeId => {
                    const range = THC_RANGES.find(r => r.id === rangeId);
                    return range ? (
                      <span key={rangeId} className="px-2 py-1 bg-white text-gray-700 text-xs rounded border border-gray-200">
                        THC {range.label}
                      </span>
                    ) : null;
                  })}
                  {filters.priceRanges.map(rangeId => {
                    const range = PRICE_RANGES.find(r => r.id === rangeId);
                    return range ? (
                      <span key={rangeId} className="px-2 py-1 bg-white text-gray-700 text-xs rounded border border-gray-200">
                        Price {range.label}
                      </span>
                    ) : null;
                  })}
                  {searchQuery && (
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200">
                      Search: &quot;{searchQuery}&quot;
                    </span>
                  )}
                  {sortBy !== 'default' && (
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded border border-purple-200">
                      Sort: {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                    </span>
                  )}
                </div>
              </div>
              
              <p className="text-xs text-gray-500">
                {savedFilters.length >= MAX_SAVED_FILTERS 
                  ? `⚠️ You have reached the maximum of ${MAX_SAVED_FILTERS} saved filters. Saving will remove the oldest filter.`
                  : `You can save up to ${MAX_SAVED_FILTERS} filters (${MAX_SAVED_FILTERS - savedFilters.length} remaining).`}
              </p>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowSaveFilterModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCurrentFilter}
                disabled={!newFilterName.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Filter Sheet */}
      <MobileFilterSheet
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        filters={filters}
        onFilterChange={setFilters}
        activeFilterCount={activeFilterCount}
      />
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
  onClear 
}: { 
  products: Product[]; 
  onClose: () => void; 
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const getThcColor = (thc: number | null) => {
    if (!thc) return 'bg-gray-100';
    if (thc < 15) return 'bg-emerald-500';
    if (thc < 20) return 'bg-yellow-500';
    if (thc < 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStrainTypeColor = (strainType: string | null) => {
    if (!strainType) return 'bg-gray-100 text-gray-700';
    const lower = strainType.toLowerCase();
    if (lower.includes('indica')) return 'bg-purple-100 text-purple-700';
    if (lower.includes('sativa')) return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-700';
  };

  const comparisonAttributes = [
    { label: 'Price', key: 'price', format: (p: Product) => `\$\${p.price.toFixed(2)}` },
    { label: 'THC', key: 'thc', format: (p: Product) => p.thc ? `\${p.thc}%` : 'N/A' },
    { label: 'CBD', key: 'cbd', format: (p: Product) => p.cbd ? `\${p.cbd}%` : 'N/A' },
    { label: 'Strain Type', key: 'strainType', format: (p: Product) => p.strainType || 'N/A' },
    { label: 'Strain', key: 'strain', format: (p: Product) => p.strain || 'N/A' },
    { label: 'Product Type', key: 'productType', format: (p: Product) => p.productType || 'N/A' },
    { label: 'Unit', key: 'unit', format: (p: Product) => p.unit || 'unit' },
    { label: 'Stock', key: 'inventoryQty', format: (p: Product) => `\${p.inventoryQty} units` },
    { label: 'Grower', key: 'grower', format: (p: Product) => p.grower.businessName },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Scale className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Product Comparison</h2>
              <p className="text-sm text-gray-500">Comparing {products.length} products side-by-side</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClear}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Comparison Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className={`grid gap-4 \${products.length === 2 ? 'grid-cols-2' : products.length === 3 ? 'grid-cols-3' : 'grid-cols-1'}`}>
            {products.map(product => (
              <div key={product.id} className="bg-gray-50 rounded-xl overflow-hidden">
                {/* Product Header */}
                <div className="p-4 bg-white border-b border-gray-200">
                  <div className="relative h-32 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl opacity-30">🌿</span>
                    )}
                    <button
                      onClick={() => onRemove(product.id)}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-gray-400 hover:text-red-500 shadow-sm"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{product.name}</h3>
                  <Link 
                    href={`/dispensary/grower/\${product.grower.id}`}
                    className="text-sm text-green-600 hover:underline"
                  >
                    {product.grower.businessName}
                  </Link>
                </div>

                {/* THC Visual Bar */}
                {product.thc && (
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">THC Potency</span>
                      <span className="text-lg font-bold text-gray-900">{product.thc}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full \${getThcColor(product.thc)} transition-all duration-500`}
                        style={{ width: `\${Math.min(product.thc, 35) / 35 * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Attributes */}
                <div className="divide-y divide-gray-200">
                  {comparisonAttributes.map(attr => (
                    <div key={attr.key} className="px-4 py-3 flex items-center justify-between">
                      <span className="text-sm text-gray-500">{attr.label}</span>
                      <span className={`text-sm font-medium \${
                        attr.key === 'price' ? 'text-green-700 text-lg' : 
                        attr.key === 'thc' ? 'text-gray-900' :
                        attr.key === 'strainType' ? 'px-2 py-0.5 rounded-full ' + getStrainTypeColor(product.strainType) :
                        'text-gray-900'
                      }`}>
                        {attr.format(product)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <div className="p-4 bg-white border-t border-gray-200">
                  <AddToCartButton 
                    product={product}
                    growerName={product.grower.businessName}
                    growerId={product.grower.id}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Visual Comparison Charts */}
          {products.length >= 2 && (
            <div className="mt-8 bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Price Comparison
              </h3>
              <div className="space-y-4">
                {products.map(product => {
                  const maxPrice = Math.max(...products.map(p => p.price));
                  const percentage = (product.price / maxPrice) * 100;
                  return (
                    <div key={product.id} className="flex items-center gap-4">
                      <div className="w-32 truncate text-sm font-medium text-gray-700">
                        {product.name}
                      </div>
                      <div className="flex-1 h-8 bg-gray-200 rounded-lg overflow-hidden">
                        <div 
                          className="h-full bg-green-500 flex items-center justify-end pr-2"
                          style={{ width: `\${percentage}%` }}
                        >
                          <span className="text-white text-sm font-bold">\${product.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function groupByGrower(products: Product[]) {
  const groups: { growerId: string; growerName: string; products: Product[] }[] = [];
  
  products.forEach(product => {
    const existingGroup = groups.find(g => g.growerId === product.grower.id);
    if (existingGroup) {
      existingGroup.products.push(product);
    } else {
      groups.push({
        growerId: product.grower.id,
        growerName: product.grower.businessName,
        products: [product],
      });
    }
  });
  
  return groups;
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
  onAlertToggle
}: { 
  product: Product; 
  isInCompare: boolean;
  onCompareToggle: () => void;
  compareDisabled: boolean;
  isFav: boolean;
  onFavoriteToggle: () => void;
  hasAlert?: boolean;
  onAlertToggle?: () => void;
}) {
  const [imageHovered, setImageHovered] = useState(false);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setImagePosition({ x, y });
  };
  
  const getStockStatus = () => {
    if (product.inventoryQty === 0) {
      return { text: 'Out of Stock', color: 'bg-red-100 text-red-700 border-red-200', dotColor: 'bg-red-500' };
    }
    if (product.inventoryQty <= 10) {
      return { text: `Low Stock (\${product.inventoryQty})`, color: 'bg-orange-100 text-orange-700 border-orange-200', dotColor: 'bg-orange-500' };
    }
    return { text: 'In Stock', color: 'bg-green-100 text-green-700 border-green-200', dotColor: 'bg-green-500' };
  };
  
  const getThcBadgeColor = (thc: number) => {
    if (thc < 15) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (thc < 20) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (thc < 25) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };
  
  const getCbdBadgeColor = (cbd: number) => {
    if (cbd < 1) return 'bg-gray-100 text-gray-600 border-gray-200';
    if (cbd < 5) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  };
  
  const getStrainTypeColor = (strain: string | null, strainType: string | null) => {
    if (strainType) {
      const lower = strainType.toLowerCase();
      if (lower.includes('indica')) return 'bg-purple-100 text-purple-800 border-purple-200';
      if (lower.includes('sativa')) return 'bg-amber-100 text-amber-800 border-amber-200';
      if (lower.includes('hybrid')) return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (!strain) return 'bg-gray-100 text-gray-700';
    const lower = strain.toLowerCase();
    if (lower.includes('indica')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (lower.includes('sativa')) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };
  
  const strainType = product.strainType || (product.strain ? 
    (product.strain.toLowerCase().includes('indica') ? 'Indica' : 
     product.strain.toLowerCase().includes('sativa') ? 'Sativa' : 'Hybrid') : null);
  
  const moq = Math.max(1, Math.ceil(product.price / 50));
  const stockStatus = getStockStatus();
  
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 bg-white group">
      {/* Product Image with Zoom */}
      <div 
        className="relative h-48 bg-gradient-to-br from-green-50 to-emerald-100 overflow-hidden cursor-crosshair"
        onMouseEnter={() => setImageHovered(true)}
        onMouseLeave={() => setImageHovered(false)}
        onMouseMove={handleMouseMove}
      >
        {/* Compare Checkbox Overlay */}
        <div className="absolute top-2 left-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCompareToggle();
            }}
            disabled={compareDisabled && !isInCompare}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all \${
              isInCompare 
                ? 'bg-green-600 text-white shadow-lg' 
                : compareDisabled 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white shadow-sm'
            }`}
          >
            {isInCompare ? <Check size={14} /> : <Plus size={14} />}
            {isInCompare ? 'Comparing' : 'Compare'}
          </button>
        </div>

        {/* Favorite Button */}
        <div className="absolute top-2 right-12 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle();
            }}
            className={`p-2 rounded-lg transition-all ${
              isFav
                ? "bg-red-100 text-red-500 shadow-md"
                : "bg-white/90 backdrop-blur-sm text-gray-400 hover:text-red-400 hover:bg-white shadow-sm"
            }`}
            title={isFav ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart size={16} fill={isFav ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Product Image or Placeholder */}
        {product.images && product.images.length > 0 ? (
          <div 
            className="w-full h-full bg-cover bg-center transition-transform duration-300"
            style={{ 
              backgroundImage: `url(\${product.images[0]})`,
              transform: imageHovered ? 'scale(1.5)' : 'scale(1)',
              transformOrigin: `\${imagePosition.x}% \${imagePosition.y}%`
            }}
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center transition-transform duration-300"
            style={{ 
              transform: imageHovered ? 'scale(1.3)' : 'scale(1)'
            }}
          >
            <span className="text-7xl opacity-30">🌿</span>
          </div>
        )}
        
        {/* Magnify Overlay on Hover */}
        <div className={`absolute inset-0 bg-black/10 flex items-center justify-center transition-all duration-300 \${imageHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg transform scale-110">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </div>
        </div>
        
        {/* Stock Status Badge */}
        <div className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 \${stockStatus.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full \${stockStatus.dotColor}`}></span>
          {stockStatus.text}
        </div>
        
        {/* MOQ Badge */}
        <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
          MOQ: {moq}
        </div>
      </div>
      
      <div className="p-4">
        {/* Product Name */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">{product.name}</h3>
          {product.grower.isVerified && (
            <span className="text-green-600" title="Verified Grower">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </span>
          )}
        </div>
        
        {/* Grower Name */}
        <p className="text-sm text-gray-500 mb-2">
          by <Link href={`/dispensary/grower/\${product.grower.id}`} className="text-green-600 hover:underline">{product.grower.businessName}</Link>
        </p>
        
        {/* Strain Type Badge */}
        {strainType && (
          <div className="mb-2">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border \${getStrainTypeColor(product.strain, strainType)}`}>
              {strainType}
            </span>
          </div>
        )}
        
        {/* THC & CBD Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {product.thc && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border \${getThcBadgeColor(product.thc)} flex items-center gap-1`}>
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z"/>
              </svg>
              THC {product.thc}%
            </span>
          )}
          {product.cbd && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border \${getCbdBadgeColor(product.cbd)} flex items-center gap-1`}>
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-2 2A1 1 0 004 11v5a1 1 0 001 1h10a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0013 8.171V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a4 4 0 00-2.17-.102l1.027-1.028A3 3 0 009 8.172z" clipRule="evenodd"/>
              </svg>
              CBD {product.cbd}%
            </span>
          )}
          {product.productType && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
              {product.productType}
            </span>
          )}
        </div>
        
        {/* Strain & Unit Info */}
        <div className="mb-3 text-sm text-gray-600">
          {product.strain && !product.strain.toLowerCase().includes('indica') && !product.strain.toLowerCase().includes('sativa') && !product.strain.toLowerCase().includes('hybrid') && (
            <p className="mb-1">
              <span className="text-gray-400">Strain:</span> {product.strain}
            </p>
          )}
          <p className="text-xs text-gray-500">
            <span className="text-gray-400">Unit:</span> {product.unit || 'unit'} • <span className="text-gray-400">Stock:</span> {product.inventoryQty} units
          </p>
        </div>

        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-xl font-bold text-green-700">\${product.price.toFixed(2)}</span>
            <span className="text-sm text-gray-500 ml-1">/ {product.unit || 'unit'}</span>
          </div>
          <AddToCartButton 
            product={product} 
            growerName={product.grower.businessName}
            growerId={product.grower.id}
          />
        </div>
        
        {/* Test Results Link */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button 
            className="w-full flex items-center justify-center gap-2 text-xs font-medium text-gray-500 hover:text-green-700 py-1 rounded-lg hover:bg-green-50 transition-colors"
            title="View Certificate of Analysis"
          >
            <FileText size={14} />
            View Lab Results (COA)
          </button>
        </div>
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
  onAlertToggle
}: { 
  product: Product; 
  isInCompare: boolean;
  onCompareToggle: () => void;
  compareDisabled: boolean;
  isFav: boolean;
  onFavoriteToggle: () => void;
  hasAlert?: boolean;
  onAlertToggle?: () => void;
}) {
  const stockStatus = product.inventoryQty === 0 
    ? { text: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-50' }
    : product.inventoryQty <= 10 
      ? { text: 'Low Stock', color: 'text-orange-600', bg: 'bg-orange-50' }
      : { text: 'In Stock', color: 'text-green-600', bg: 'bg-green-50' };

  const strainType = product.strainType || (product.strain ? 
    (product.strain.toLowerCase().includes('indica') ? 'Indica' : 
     product.strain.toLowerCase().includes('sativa') ? 'Sativa' : 'Hybrid') : null);
  
  const getStrainTypeColor = (strain: string | null, strainType: string | null) => {
    if (strainType) {
      const lower = strainType.toLowerCase();
      if (lower.includes('indica')) return 'bg-purple-100 text-purple-700';
      if (lower.includes('sativa')) return 'bg-amber-100 text-amber-700';
      if (lower.includes('hybrid')) return 'bg-blue-100 text-blue-700';
    }
    if (!strain) return 'bg-gray-100 text-gray-600';
    const lower = strain.toLowerCase();
    if (lower.includes('indica')) return 'bg-purple-100 text-purple-700';
    if (lower.includes('sativa')) return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-700';
  };

  const getThcBadgeColor = (thc: number) => {
    if (thc < 15) return 'bg-emerald-50 text-emerald-700';
    if (thc < 20) return 'bg-yellow-50 text-yellow-700';
    if (thc < 25) return 'bg-orange-50 text-orange-700';
    return 'bg-red-50 text-red-700';
  };
  
  const moq = Math.max(1, Math.ceil(product.price / 50));

  return (
    <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors bg-white">
      {/* Compare Checkbox */}
      <button
        onClick={onCompareToggle}
        disabled={compareDisabled && !isInCompare}
        className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all \${
          isInCompare 
            ? 'bg-green-600 text-white' 
            : compareDisabled 
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title={isInCompare ? 'Remove from compare' : compareDisabled ? 'Max 3 products' : 'Add to compare'}
      >
        {isInCompare ? <Check size={16} /> : <Scale size={16} />}
      </button>

      {/* Favorite Button */}
      <button
        onClick={onFavoriteToggle}
        className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
          isFav
            ? "bg-red-100 text-red-500" 
            : "bg-gray-100 text-gray-400 hover:text-red-400 hover:bg-gray-200"
        }`}
        title={isFav ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart size={16} fill={isFav ? "currentColor" : "none"} />
      </button>

      {/* Price Alert Button */}
      <button
        onClick={onAlertToggle}
        className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
          hasAlert
            ? "bg-orange-100 text-orange-600"
            : "bg-gray-100 text-gray-400 hover:text-orange-500 hover:bg-gray-200"
        }`}
        title={hasAlert ? "Price alert set" : "Set price alert"}
      >
        {hasAlert ? <BellRing size={16} /> : <Bell size={16} />}
      </button>

      {/* Product Image Thumbnail */}
      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl opacity-30">🌿</span>
        )}
      </div>
      
      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              {product.grower.isVerified && (
                <span className="text-green-600" title="Verified Grower">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
              <span>by <Link href={`/dispensary/grower/\${product.grower.id}`} className="text-green-600 hover:underline">{product.grower.businessName}</Link></span>
              {product.strain && (
                <span><span className="font-medium">Strain:</span> {product.strain}</span>
              )}
              {product.productType && (
                <span><span className="font-medium">Type:</span> {product.productType}</span>
              )}
              {product.subType && (
                <span className="text-gray-500">{product.subType}</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile Badges */}
        <div className="flex flex-wrap gap-2 mt-2 md:hidden">
          {strainType && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium \${getStrainTypeColor(strainType, strainType)}`}>
              {strainType}
            </span>
          )}
          {product.thc && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium \${getThcBadgeColor(product.thc)}`}>
              THC {product.thc}%
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            MOQ: {moq}
          </span>
        </div>
      </div>

      {/* Desktop: THC Badge */}
      {product.thc && (
        <div className={`hidden md:flex flex-col items-center px-3 py-1.5 rounded-lg \${getThcBadgeColor(product.thc)}`}>
          <span className="text-xs font-medium">THC</span>
          <span className="text-sm font-bold">{product.thc}%</span>
        </div>
      )}

      {/* Desktop: Strain Type */}
      {strainType && (
        <div className={`hidden lg:flex items-center px-3 py-1.5 rounded-lg \${getStrainTypeColor(strainType, strainType)}`}>
          <span className="text-sm font-medium">{strainType}</span>
        </div>
      )}

      {/* Stock Status */}
      <div className={`hidden md:flex items-center px-3 py-1.5 rounded-lg \${stockStatus.bg}`}>
        <span className={`text-sm font-medium \${stockStatus.color}`}>{stockStatus.text}</span>
      </div>
      
      {/* MOQ */}
      <div className="hidden lg:flex flex-col items-center px-3 py-1.5 bg-blue-50 rounded-lg">
        <span className="text-xs text-blue-600 font-medium">MOQ</span>
        <span className="text-sm font-bold text-blue-700">{moq}</span>
      </div>

      {/* Price */}
      <div className="text-right min-w-[100px]">
        <div className="text-lg font-bold text-green-700">\${product.price.toFixed(2)}</div>
        <div className="text-xs text-gray-500">/{product.unit || 'unit'}</div>
      </div>

      {/* Add to Cart */}
      <div className="flex-shrink-0">
        <AddToCartButton 
          product={product} 
          growerName={product.grower.businessName}
          growerId={product.grower.id}
          compact
        />
      </div>
    </div>
  );
}
