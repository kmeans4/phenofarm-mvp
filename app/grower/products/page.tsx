'use client';

import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';

// Types
interface Product {
  id: string;
  growerId: string;
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
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date | null;
}

interface ProductFormData {
  name: string;
  strain: string;
  category: string;
  subcategory: string;
  thc: string;
  cbd: string;
  price: string;
  inventoryQty: string;
  unit: string;
  description: string;
  images: string[];
}

// Product Modal Component (reusable for add/edit)
function ProductModal({ 
  isOpen, 
  onClose, 
  onSave,
  initialData 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: ProductFormData) => void;
  initialData?: Partial<Product>;
}) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || '',
    strain: initialData?.strain || '',
    category: initialData?.category || '',
    subcategory: initialData?.subcategory || '',
    thc: initialData?.thc?.toString() || '',
    cbd: initialData?.cbd?.toString() || '',
    price: initialData?.price?.toString() || '',
    inventoryQty: initialData?.inventoryQty?.toString() || '0',
    unit: initialData?.unit || 'gram',
    description: initialData?.description || '',
    images: [],
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newPreviews: string[] = [];
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          newPreviews.push(result);
          if (newPreviews.length === files.length) {
            setImagePreviews(prev => [...prev, ...newPreviews]);
            setFormData(prev => ({ ...prev, images: [...prev.images, ...newPreviews] }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData?.id ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Strain
                </label>
                <input
                  type="text"
                  value={formData.strain}
                  onChange={(e) => setFormData({ ...formData, strain: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  <option value="flower">Flower</option>
                  <option value="concentrates">Concentrates</option>
                  <option value="edibles">Edibles</option>
                  <option value="topicals">Topicals</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategory
                </label>
                <input
                  type="text"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  THC (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  max="100"
                  value={formData.thc}
                  onChange={(e) => setFormData({ ...formData, thc: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CBD (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  max="100"
                  value={formData.cbd}
                  onChange={(e) => setFormData({ ...formData, cbd: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inventory Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.inventoryQty}
                  onChange={(e) => setFormData({ ...formData, inventoryQty: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="gram">Gram</option>
                  <option value="half_ounce">Half Ounce</option>
                  <option value="ounce">Ounce</option>
                  <option value="eighth">Eighth</option>
                  <option value="quarter">Quarter</option>
                  <option value="unit">Unit</option>
                  <option value="pack">Pack</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Images
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={preview} 
                        alt={`Preview ${index + 1}`} 
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {initialData?.id ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// CSV Upload Form Component
function CSVUploadForm({ onUploadComplete }: { onUploadComplete: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please upload a CSV file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload a CSV file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('csv', file);

      const response = await fetch('/api/products', {
        method: 'PUT',
        body: formData,
      });

      if (response.ok) {
        setFile(null);
        onUploadComplete();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to upload CSV');
      }
    } catch (err) {
      setError('Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-2 border-dashed rounded-lg p-8 text-center bg-gray-50">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
        id="csv-upload"
      />
      <label
        htmlFor="csv-upload"
        className={`cursor-pointer block ${isDragging ? 'bg-green-50 border-green-400' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-2">
          <div className="text-4xl">📁</div>
          <p className={`text-lg ${isDragging ? 'text-green-700' : 'text-gray-700'}`}>
            Drag and drop your CSV file here
          </p>
          <p className="text-sm text-gray-500">
            CSV format: name, strain, category, subcategory, thc, cbd, price, inventoryQty, unit, description, images
          </p>
          {file && (
            <p className="text-sm text-green-600 font-medium">
              Selected: {file.name}
            </p>
          )}
        </div>
      </label>
      
      <div className="mt-4">
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
            !file || uploading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {uploading ? 'Uploading...' : 'Upload CSV'}
        </button>
      </div>
      
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Confirm Delete</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-gray-700">Are you sure you want to delete this product? This action cannot be undone.</p>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main Page Component
export default function GrowerProductsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterAvailability, setFilterAvailability] = useState<string>('');
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          setProductsList(data);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Sort and filter products
  const sortedFilteredProducts = productsList
    .filter(product => {
      if (filterCategory && product.category !== filterCategory) return false;
      if (filterAvailability === 'available' && !product.isAvailable) return false;
      if (filterAvailability === 'unavailable' && product.isAvailable) return false;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'inventoryQty':
          comparison = a.inventoryQty - b.inventoryQty;
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Handlers
  const handleSaveProduct = async (data: ProductFormData) => {
    if (editingId) {
      await handleUpdateProduct(data);
      return;
    }

    const productData = {
      name: data.name,
      strain: data.strain || null,
      category: data.category || null,
      subcategory: data.subcategory || null,
      thc: data.thc ? parseFloat(data.thc) : null,
      cbd: data.cbd ? parseFloat(data.cbd) : null,
      price: parseFloat(data.price),
      inventoryQty: parseInt(data.inventoryQty),
      unit: data.unit,
      description: data.description || null,
      images: data.images,
      isAvailable: true,
    };

    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    if (response.ok) {
      const newProduct = await response.json();
      setProductsList([newProduct, ...productsList]);
      setIsAddModalOpen(false);
    }
  };

  const handleUpdateProduct = async (data: ProductFormData) => {
    if (!editingId && !selectedProduct) return;

    const productId = editingId || selectedProduct!.id;

    const productData = {
      name: data.name,
      strain: data.strain || null,
      category: data.category || null,
      subcategory: data.subcategory || null,
      thc: data.thc ? parseFloat(data.thc) : null,
      cbd: data.cbd ? parseFloat(data.cbd) : null,
      price: parseFloat(data.price),
      inventoryQty: parseInt(data.inventoryQty),
      unit: data.unit,
      description: data.description || null,
      images: data.images,
      isAvailable: selectedProduct?.isAvailable,
    };

    const response = await fetch(`/api/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    if (response.ok) {
      const updatedProduct = await response.json();
      setProductsList(productsList.map(p => 
        p.id === productId ? updatedProduct : p
      ));
      setIsAddModalOpen(false);
      setEditingId(null);
      setSelectedProduct(null);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    const response = await fetch(`/api/products/${selectedProduct.id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      setProductsList(productsList.filter(p => p.id !== selectedProduct.id));
      setIsDeleteModalOpen(false);
      setSelectedProduct(null);
    }
  };

  const handleToggleAvailability = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });

      if (response.ok) {
        const updatedProduct = await response.json();
        setProductsList(productsList.map(p => 
          p.id === productId ? updatedProduct : p
        ));
      }
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setEditingId(product.id);
    setIsAddModalOpen(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleDownloadTemplate = () => {
    const csvContent = "name,strain,category,subcategory,thc,cbd,price,inventoryQty,unit,description,images\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "products_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600 mt-1">Manage your cannabis product catalog</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-white border-gray-300 hover:bg-gray-50" onClick={handleDownloadTemplate}>
            Download CSV Template
          </Button>
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
            + Add Product
          </Button>
        </div>
      </div>

      {/* CSV Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Upload Products</CardTitle>
        </CardHeader>
        <CardContent>
          <CSVUploadForm onUploadComplete={() => {
            // Refresh products after upload
            fetch('/api/products')
              .then(res => res.json())
              .then(data => setProductsList(data));
          }} />
          <p className="mt-4 text-sm text-gray-500">
            CSV format: name, strain, category, subcategory, thc, cbd, price, inventoryQty, unit, description, images
          </p>
        </CardContent>
      </Card>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <CardTitle>Products</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="flower">Flower</option>
                <option value="concentrates">Concentrates</option>
                <option value="edibles">Edibles</option>
                <option value="topicals">Topicals</option>
                <option value="accessories">Accessories</option>
              </select>
              <select
                value={filterAvailability}
                onChange={(e) => setFilterAvailability(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Your Products ({sortedFilteredProducts.length})</CardTitle>
            {/* Sorting Dropdown */}
            <div className="flex gap-2 flex-wrap">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="createdAt">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="price">Sort by Price</option>
                <option value="inventoryQty">Sort by Inventory</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </CardHeader>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strain</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">THC/CBD</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedFilteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No products found. Add your first product above.
                  </td>
                </tr>
              ) : (
                sortedFilteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.strain || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.strain || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.thc ? `${product.thc}%` : '-'} / {product.cbd ? `${product.cbd}%` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.inventoryQty} {product.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={product.isAvailable ? 'success' : 'danger'}>
                        {product.isAvailable ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleToggleAvailability(product.id, product.isAvailable)}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Toggle
                      </button>
                      <button 
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(product)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {sortedFilteredProducts.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-center items-center gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">Previous</button>
            <span className="text-sm text-gray-700">Page 1 of 1</span>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">Next</button>
          </div>
        )}
      </Card>

      {/* Modals */}
      <ProductModal 
        isOpen={isAddModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingId(null);
        }} 
        onSave={handleSaveProduct}
        initialData={editingId ? productsList.find(p => p.id === editingId) : undefined}
      />
      
      <DeleteConfirmModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleDeleteProduct}
      />
    </div>
  );
}
