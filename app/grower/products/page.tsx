'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  strain: string | null;
  category: string | null;
  price: number;
  inventoryQty: number;
  unit: string;
  isAvailable: boolean;
  createdAt: string;
}

export default function GrowerProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/sign_in');
      return;
    }

    const user = session.user as any;
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
        // Validate data is array
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || `Failed to fetch products (${response.status})`);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Network error - please check your connection');
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId));
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleAvailability = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });
      if (response.ok) {
        const updated = await response.json().catch(() => ({}));
        setProducts(products.map(p => p.id === productId ? { ...p, isAvailable: !!updated?.isAvailable } : p));
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Safe calculations
  const totalProducts = products?.length || 0;
  const totalValue = products?.reduce((sum, p) => {
    const price = typeof p?.price === 'number' ? p.price : 0;
    const qty = typeof p?.inventoryQty === 'number' ? p.inventoryQty : 0;
    return sum + (price * qty);
  }, 0) || 0;
  const availableCount = products?.filter(p => !!p?.isAvailable)?.length || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600 mt-1">Manage your cannabis product catalog</p>
        </div>
        <Link href="/grower/products/add" className="px-4 py-2 bg-green-600 text-white rounded-lg">+ Add Product</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Products</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalProducts}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Available</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{availableCount}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
          <button onClick={fetchProducts} className="mt-2 px-4 py-2 bg-gray-200 rounded-lg">Retry</button>
        </div>
      )}

      {/* Products */}
      {products?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product?.id || Math.random()} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{product?.name || 'Unnamed Product'}</p>
                  {product?.strain && <p className="text-sm text-gray-600 truncate">{product.strain}</p>}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs flex-shrink-0 ${product?.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {product?.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900 mt-2">
                ${typeof product?.price === 'number' ? product.price.toFixed(2) : '0.00'}
              </p>
              <p className="text-sm text-gray-600">
                Stock: {typeof product?.inventoryQty === 'number' ? product.inventoryQty : 0} {product?.unit || ''}
              </p>
              <div className="flex gap-3 mt-4">
                <a 
                  href={`/grower/products/${product?.id}/edit`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Edit
                </a>
                <button 
                  onClick={() => toggleAvailability(product?.id, product?.isAvailable)} 
                  className="text-sm text-gray-600 hover:underline"
                >
                  {product?.isAvailable ? 'Disable' : 'Enable'}
                </button>
                <button 
                  onClick={() => deleteProduct(product?.id)} 
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
          <p className="text-gray-600 mb-4">No products found</p>
          <Link href="/grower/products/add" className="text-green-600 hover:underline">Add your first product</Link>
        </div>
      )}
    </div>
  );
}
