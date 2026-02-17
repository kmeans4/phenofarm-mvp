'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ExtendedUser, AuthSession } from '@/types';
import { Button } from '@/app/components/ui/Button';

type FilterType = 'all' | 'byProductType' | 'byStrain' | 'byBatch';
interface Strain {
  id: string;
  name: string;
  genetics: string | null;
}

interface Batch {
  id: string;
  batchNumber: string;
}

interface Product {
  id: string;
  name: string;
  strain: Strain | null;
  strainLegacy: string | null;
  category: string | null;
  categoryLegacy: string | null;
  productType: string | null;
  subType: string | null;
  batchId: string | null;
  batch: Batch | null;
  price: number;
  inventoryQty: number;
  unit: string;
  isAvailable: boolean;
  createdAt: string;
}

interface GroupedProducts {
  [key: string]: Product[];
}

export default function GrowerProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // Load view mode from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('productViewMode');
    if (saved === 'card' || saved === 'list') {
      setViewMode(saved);
    }
  }, []);

  // Save view mode to localStorage when changed
  const handleViewModeChange = (mode: 'card' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('productViewMode', mode);
  };

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/sign_in');
      return;
    }

    const user = (session as AuthSession).user;
    if (user.role !== 'GROWER') {
      router.push('/dashboard');
      return;
    }

    fetchProducts();
  }, [status, session, router]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setProducts(data);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || 'Failed to fetch products (' + response.status + ')');
      }
    } catch {
      setError('Network error - please check your connection');
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const response = await fetch('/api/products/' + productId, { method: 'DELETE' });
      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId));
      } else {
        alert('Failed to delete product');
      }
    } catch {
      console.error('Error:', error);
    }
  };

  const toggleAvailability = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/products/' + productId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });
      if (response.ok) {
        const updated = await response.json();
        setProducts(products.map(p => p.id === productId ? { ...p, isAvailable: updated.isAvailable } : p));
      } else {
        alert('Failed to update product');
      }
    } catch {
      console.error('Error:', error);
    }
  };

  // Get strain name for display
  const getStrainName = (product: Product): string => {
    if (product.strain?.name) return product.strain.name;
    if (product.strainLegacy) return product.strainLegacy;
    return '';
  };

  // Group products based on active filter
  const getGroupedProducts = (): { groups: GroupedProducts; groupOrder: string[] } => {
    const groups: GroupedProducts = {};
    const groupOrder: string[] = [];

    if (activeFilter === 'all') {
      groups['All Products'] = products;
      groupOrder.push('All Products');
      return { groups, groupOrder };
    }

    if (activeFilter === 'byProductType') {
      products.forEach(product => {
        const type = product.productType || product.categoryLegacy || 'Uncategorized';
        if (!groups[type]) {
          groups[type] = [];
          groupOrder.push(type);
        }
        groups[type].push(product);
      });
    } else if (activeFilter === 'byStrain') {
      products.forEach(product => {
        const strainName = getStrainName(product) || 'Unknown Strain';
        if (!groups[strainName]) {
          groups[strainName] = [];
          groupOrder.push(strainName);
        }
        groups[strainName].push(product);
      });
    } else if (activeFilter === 'byBatch') {
      products.forEach(product => {
        const batchLabel = product.batch?.batchNumber 
          ? `Batch ${product.batch.batchNumber}`
          : product.batchId 
            ? `Batch ${product.batchId.slice(0, 8)}...`
            : 'No Batch';
        if (!groups[batchLabel]) {
          groups[batchLabel] = [];
          groupOrder.push(batchLabel);
        }
        groups[batchLabel].push(product);
      });
    }

    // Sort groupOrder alphabetically
    groupOrder.sort((a, b) => a.localeCompare(b));

    return { groups, groupOrder };
  };

  const { groups, groupOrder } = getGroupedProducts();

  const totalProducts = products?.length || 0;
  const totalValue = products?.reduce((sum, p) => sum + ((p?.price || 0) * (p?.inventoryQty || 0)), 0) || 0;
  const availableCount = products?.filter(p => p?.isAvailable)?.length || 0;

  const filterTabs = [
    { key: 'all', label: 'All', icon: 'M4 6h16M4 12h16M4 18h16' },
    { key: 'byProductType', label: 'By Product Type', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
    { key: 'byStrain', label: 'By Strain', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
    { key: 'byBatch', label: 'By Batch', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  ] as const;

  // View mode toggle icons
  const CardViewIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );

  const ListViewIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );

  const ProductCard = ({ product }: { product: Product }) => {
    const strainName = getStrainName(product);
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
        {/* Card Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 truncate">{product?.name || 'Unnamed Product'}</p>
              {strainName && (
                <p className="text-sm text-gray-500 truncate">{strainName}</p>
              )}
            </div>
            <span 
              className={'px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ' + (
                product?.isAvailable 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              )}
            >
              {product?.isAvailable ? 'Available' : 'Unavailable'}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4">
          <div className="flex justify-between items-baseline mb-3">
            <p className="text-2xl font-bold text-gray-900">
              ${typeof product?.price === 'number' ? product.price.toFixed(2) : '0.00'}
            </p>
            <p className="text-sm text-gray-500">per {product?.unit || 'unit'}</p>
          </div>
          
          {/* Additional Info */}
          <div className="space-y-1 mb-3">
            {(product?.productType || product?.categoryLegacy) && (
              <p className="text-xs text-gray-500">
                <span className="font-medium">Type:</span> {product.productType || product.categoryLegacy}
              </p>
            )}
            {product?.batch?.batchNumber && (
              <p className="text-xs text-gray-500">
                <span className="font-medium">Batch:</span> {product.batch.batchNumber}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className={(product?.inventoryQty || 0) <= 5 ? 'text-red-600 font-medium' : ''}>
              {product?.inventoryQty || 0} in stock
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            <Button variant="outline" size="sm" asChild className="flex-1">
              <Link href={'/grower/products/' + product?.id + '/edit'}>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Link>
            </Button>
            
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => toggleAvailability(product?.id, product?.isAvailable)}
              className="flex-1"
            >
              {product?.isAvailable ? 'Disable' : 'Enable'}
            </Button>
            
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => deleteProduct(product?.id)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Product Row component for list view
  const ProductRow = ({ product }: { product: Product }) => {
    const strainName = getStrainName(product);
    
    return (
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3">
          <div className="font-medium text-gray-900">{product?.name || 'Unnamed'}</div>
          {strainName && <div className="text-sm text-gray-500">{strainName}</div>}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {product?.productType || product?.categoryLegacy || '-'}
        </td>
        <td className="px-4 py-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            product?.isAvailable 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {product?.isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
          ${typeof product?.price === 'number' ? product.price.toFixed(2) : '0.00'}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          <span className={(product?.inventoryQty || 0) <= 5 ? 'text-red-600 font-medium' : ''}>
            {product?.inventoryQty || 0} {product?.unit}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={'/grower/products/' + product?.id + '/edit'}>Edit</Link>
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => toggleAvailability(product?.id, product?.isAvailable)}
            >
              {product?.isAvailable ? 'Disable' : 'Enable'}
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => deleteProduct(product?.id)}
            >
              Delete
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  // Product Table component for list view
  const ProductTable = ({ products }: { products: Product[] }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <ProductRow key={product.id} product={product} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600 mt-1">Manage your cannabis product catalog</p>
        </div>
        <Button variant="primary" asChild>
          <Link href="/grower/products/add">+ Add Product</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-600">Total Products</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalProducts}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-600">Total Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-600">Available</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{availableCount}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
          <Button variant="secondary" onClick={fetchProducts} className="mt-2">Retry</Button>
        </div>
      )}

      {/* Filter Tabs & View Toggle */}
      <div className="bg-white p-2 sm:p-3 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key as FilterType)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  activeFilter === tab.key
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">
                  {tab.key === 'all' ? 'All' : 
                   tab.key === 'byProductType' ? 'Type' :
                   tab.key === 'byStrain' ? 'Strain' : 'Batch'}
                </span>
              </button>
            ))}
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border-t border-gray-200 pt-2 sm:border-t-0 sm:border-l sm:border-gray-200 sm:pt-0 sm:pl-3">
            <button
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === 'card'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title="Card view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title="List view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 6h18M3 18h18" />
              </svg>
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Products Display */}
      {products?.length > 0 ? (
        <div className="space-y-8">
          {groupOrder.map((groupName) => (
            <div key={groupName} className="space-y-4">
              {/* Group Header */}
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gray-200"></div>
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
                  <span className="text-sm font-semibold text-gray-700">{groupName}</span>
                  <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                    {groups[groupName]?.length || 0}
                  </span>
                </div>
                <div className="h-px flex-1 bg-gray-200"></div>
              </div>

              {/* Products Display based on view mode */}
              {viewMode === 'card' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groups[groupName]?.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <ProductTable products={groups[groupName] || []} />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Start building your product catalog by adding your first cannabis product.
          </p>
          <Button variant="primary" asChild>
            <Link href="/grower/products/add">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add your first product
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
