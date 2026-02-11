'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';

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

const CATEGORIES = ['Flower', 'Concentrates', 'Edibles', 'Topicals', 'Accessories'];
const UNITS = ['Gram', 'Half Ounce', 'Ounce', 'Eighth', 'Quarter', 'Unit', 'Pack'];

export default function AddProductPage() {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    strain: '',
    category: '',
    subcategory: '',
    thc: '',
    cbd: '',
    price: '',
    inventoryQty: '0',
    unit: 'Gram',
    description: '',
    images: [],
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();

  const handleChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const productData = {
        name: formData.name,
        strain: formData.strain || null,
        category: formData.category || null,
        subcategory: formData.subcategory || null,
        thc: formData.thc ? parseFloat(formData.thc) : null,
        cbd: formData.cbd ? parseFloat(formData.cbd) : null,
        price: parseFloat(formData.price),
        inventoryQty: parseInt(formData.inventoryQty),
        unit: formData.unit,
        description: formData.description || null,
        images: formData.images,
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create product');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/grower/products');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
        <p className="text-gray-600 mt-1">List a new cannabis product for your inventory</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">Product created successfully! Redirecting...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Product Name *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Blueberries NF"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="strain" className="block text-sm font-medium text-gray-700">
                  Strain
                </label>
                <input
                  id="strain"
                  type="text"
                  value={formData.strain}
                  onChange={(e) => handleChange('strain', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Blueberries x Nevada"
                />
              </div>
            </div>

            {/* Category & Subcategory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category *
                </label>
                <select
                  id="category"
                  required
                  value={formData.category}
                  onChange={(e) => {
                    handleChange('category', e.target.value);
                    handleChange('subcategory', '');
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700">
                  Subcategory
                </label>
                <input
                  id="subcategory"
                  type="text"
                  value={formData.subcategory}
                  onChange={(e) => handleChange('subcategory', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Hybrid, Indica, Sativa"
                />
              </div>
            </div>

            {/* Cannabinoids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="thc" className="block text-sm font-medium text-gray-700">
                  THC (%) 
                </label>
                <input
                  id="thc"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.thc}
                  onChange={(e) => handleChange('thc', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 18.5"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="cbd" className="block text-sm font-medium text-gray-700">
                  CBD (%) 
                </label>
                <input
                  id="cbd"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.cbd}
                  onChange={(e) => handleChange('cbd', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 12.0"
                />
              </div>
            </div>

            {/* Pricing & Unit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price ($) *
                </label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 45.00"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                  Unit *
                </label>
                <select
                  id="unit"
                  required
                  value={formData.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select a unit</option>
                  {UNITS.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Inventory */}
            <div className="space-y-2">
              <label htmlFor="inventoryQty" className="block text-sm font-medium text-gray-700">
                Initial Inventory Quantity *
              </label>
              <input
                id="inventoryQty"
                type="number"
                min="0"
                required
                value={formData.inventoryQty}
                onChange={(e) => handleChange('inventoryQty', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., 100"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Describe the product, effects, aroma, etc."
              />
            </div>

            {/* Images */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Product Images
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-600
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-green-50 file:text-green-700
                    hover:file:bg-green-100
                    cursor-pointer"
                />
              </div>
              
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index}`}
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Product...' : 'Create Product'}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.push('/grower/products')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
