'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';

interface ProductFormData {
  id?: string;
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
  isAvailable: boolean;
  images: string[];
}

const CATEGORIES = ['Flower', 'Concentrates', 'Edibles', 'Topicals', 'Accessories'];
const UNITS = ['Gram', 'Half Ounce', 'Ounce', 'Eighth', 'Quarter', 'Unit', 'Pack'];

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ProductForm({ 
  initialData = {}, 
  onSubmit, 
  onCancel,
  isSubmitting = false 
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    id: initialData.id,
    name: initialData.name || '',
    strain: initialData.strain || '',
    category: initialData.category || '',
    subcategory: initialData.subcategory || '',
    thc: initialData.thc || '',
    cbd: initialData.cbd || '',
    price: initialData.price || '',
    inventoryQty: initialData.inventoryQty || '0',
    unit: initialData.unit || 'Gram',
    description: initialData.description || '',
    isAvailable: initialData.isAvailable !== undefined ? initialData.isAvailable : true,
    images: [],
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>(initialData.images || []);

  const handleChange = (field: keyof ProductFormData, value: string | boolean) => {
    if (typeof value === 'boolean') {
      setFormData(prev => ({ ...prev, isAvailable: value }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
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
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Get base64 images to send to API
  const getBase64Images = () => {
    return imagePreviews.map(preview => {
      // Remove data:image/...;base64, prefix if present
      if (preview.startsWith('data:image/')) {
        return preview;
      }
      return `data:image/jpeg;base64,${preview}`;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      images: getBase64Images(),
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {initialData.id ? 'Edit Product' : 'Add New Product'}
        </h1>
        <p className="text-gray-600 mt-1">
          {initialData.id ? 'Update your product details' : 'List a new cannabis product for your inventory'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
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

            {/* Availability Toggle */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div>
                <label className="text-sm font-medium text-gray-700">Availability Status</label>
                <p className="text-sm text-gray-600">Make product available for purchase</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('isAvailable', !formData.isAvailable)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.isAvailable ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.isAvailable ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
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
                      <Image
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
                {isSubmitting ? 'Saving...' : (initialData.id ? 'Update Product' : 'Create Product')}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={onCancel}
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
