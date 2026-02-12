'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { format } from 'date-fns';

interface Product {
  id: string;
  name: string;
  strain: string | null;
  category: string | null;
  subcategory: string | null;
  thc: number | null;
  cbd: number | null;
  price: number;
  inventoryQty: number;
  unit: string;
  isAvailable: boolean;
  description: string | null;
  images: string[];
  createdAt: string;
}

export default function GrowerProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAvailability, setFilterAvailability] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvUploadLoading, setCsvUploadLoading] = useState(false);
  const [csvUploadMessage, setCsvUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

    fetchProducts(user.growerId);
  }, [status, session, router]);

  const fetchProducts = async (growerId: string) => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
      setCsvUploadMessage(null);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;

    setCsvUploadLoading(true);
    setCsvUploadMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', csvFile);

      const response = await fetch('/api/products/bulk', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setCsvUploadMessage({ type: 'success', text: `Successfully uploaded ${data.successCount} products!` });
        fetchProducts((session?.user as any).growerId);
        setCsvFile(null);
      } else {
        const errorData = await response.json();
        setCsvUploadMessage({ type: 'error', text: errorData.error || 'Failed to upload CSV' });
      }
    } catch (error) {
      setCsvUploadMessage({ type: 'error', text: 'An error occurred during upload' });
    } finally {
      setCsvUploadLoading(false);
    }
  };

  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId));
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
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
        const updatedProduct = await response.json();
        setProducts(products.map(p => 
          p.id === productId ? { ...p, isAvailable: updatedProduct.isAvailable } : p
        ));
      }
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchesAvailability = filterAvailability === 'all' || 
      (filterAvailability === 'available' && product.isAvailable) ||
      (filterAvailability === 'unavailable' && !product.isAvailable);
    const matchesSearch = searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.strain && product.strain.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesAvailability && matchesSearch;
  });

  // Get unique categories
  const categories = [...new Set(products.map(p => p.category).filter((c): c is string => !!c))];

  // Stats
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.inventoryQty, 0);
  const availableCount = products.filter(p => p.isAvailable).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Product Management
          </h1>
          <p className="text-gray-600 mt-1">Manage your cannabis product catalog</p>
        </div>
        <div className="flex gap-3">
          <Link href="/api/products/bulk?template=true" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 h-10 px-4 py-2">
            Download Template
          </Link>
          <Link href="/grower/products/add" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-green-600 text-gray-50 hover:bg-green-700 h-10 px-4 py-2">
            + Add Product
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Total Products</p>
            <p className="text-3xl font-bold text-gray-900">{totalProducts}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Total Value</p>
            <p className="text-3xl font-bold text-gray-900">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Available</p>
            <p className="text-3xl font-bold text-green-600">{availableCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Availability</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* CSV Upload */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Bulk Upload Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {csvUploadMessage && (
              <div className={`p-3 rounded-lg ${
                csvUploadMessage.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {csvUploadMessage.text}
              </div>
            )}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">products-template.csv</p>
                <p className="text-sm text-gray-500">Download template file for bulk upload</p>
              </div>
              <a 
                href="/api/products/bulk?template=true"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gray-100 text-gray-900 hover:bg-gray-100/80 h-8 px-3 py-1 text-sm"
              >
                Download Template
              </a>
            </div>
            <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {csvFile ? csvFile.name : 'No file selected'}
                </p>
                <p className="text-sm text-gray-500">Maximum file size: 10MB</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvChange}
                  className="block w-full text-sm text-gray-600
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-green-50 file:text-green-700
                    hover:file:bg-green-100
                    cursor-pointer"
                />
                <Button 
                  variant="primary" 
                  className="text-sm"
                  onClick={handleCsvUpload}
                  disabled={!csvFile || csvUploadLoading}
                >
                  {csvUploadLoading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
                    {product.strain && (
                      <p className="text-sm text-gray-600">{product.strain}</p>
                    )}
                    {product.category && (
                      <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</p>
                    <Badge variant={product.isAvailable ? 'success' : 'error'}>
                      {product.isAvailable ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-4">
                  <div>
                    <span className="text-gray-500">Inventory: </span>
                    <span className="font-medium text-gray-900">{product.inventoryQty} {product.unit}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Added: </span>
                    <span className="text-gray-900">{format(new Date(product.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-6">
                  <a 
                    href={`/grower/products/${product.id}/edit`}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 h-9 px-4 py-2 text-sm flex-1"
                  >
                    Edit
                  </a>
                  <Button
                    variant="secondary"
                    className="text-sm py-2 flex-1"
                    onClick={() => toggleAvailability(product.id, product.isAvailable)}
                  >
                    {product.isAvailable ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="destructive"
                    className="text-sm py-2"
                    onClick={() => deleteProduct(product.id)}
                    disabled={loading}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
          <p className="text-gray-600 mb-4">No products found</p>
          <Link href="/grower/products/add" className="text-green-600 hover:text-green-700 font-medium">
            Add your first product
          </Link>
        </div>
      )}
    </div>
  );
}
