'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';

interface Strain {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  batchNumber: string;
  strain?: { name: string } | null;
}

interface EditProductFormProps {
  product: {
    id: string;
    name: string;
    strainId?: string | null;
    strainName?: string | null;
    batchId?: string | null;
    batchNumber?: string | null;
    productType?: string | null;
    subType?: string | null;
    categoryLegacy?: string | null;
    subcategoryLegacy?: string | null;
    price: number;
    inventoryQty: number;
    unit: string;
    description?: string | null;
    isAvailable: boolean;
    thc?: number | null;
    cbd?: number | null;
    sku?: string | null;
    brand?: string | null;
    ingredients?: string | null;
    images?: string[];
    isFeatured?: boolean;
  };
  strains: Strain[];
  batches: Batch[];
  productTypes: string[];
  getSubtypesForType: (type: string) => string[];
}

const DEFAULT_PRODUCT_TYPES = [
  'Bulk Extract',
  'Cartridge',
  'Edibles',
  'Drink',
  'Flower',
  'Live Plant',
  'Merchandise',
  'Plant Material',
  'Prepack',
  'Seed',
  'Tincture',
  'Topicals/Wellness',
  'Other',
];

export default function EditProductForm({ 
  product, 
  strains, 
  batches,
  productTypes,
  getSubtypesForType 
}: EditProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Form state - use new schema fields or fall back to legacy
  const [formData, setFormData] = useState({
    name: product?.name || '',
    strainId: product?.strainId || '',
    batchId: product?.batchId || '',
    productType: product?.productType || product?.categoryLegacy || '',
    subType: product?.subType || product?.subcategoryLegacy || '',
    price: product?.price?.toString() || '',
    inventoryQty: product?.inventoryQty?.toString() || '',
    unit: product?.unit || 'gram',
    description: product?.description || '',
    isAvailable: product?.isAvailable ?? true,
    thc: product?.thc?.toString() || '',
    cbd: product?.cbd?.toString() || '',
    sku: product?.sku || '',
    brand: product?.brand || '',
    ingredients: product?.ingredients || '',
    isFeatured: product?.isFeatured || false,
  });

  // Available subtypes based on selected product type
  const availableSubtypes = formData.productType 
    ? getSubtypesForType(formData.productType)
    : [];

  // Filter batches by selected strain
  const filteredBatches = formData.strainId
    ? batches.filter(b => b.strain?.name === strains.find(s => s.id === formData.strainId)?.name)
    : batches;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          productType: formData.productType || null,
          subType: formData.subType || null,
          strainId: formData.strainId || null,
          batchId: formData.batchId || null,
          price: parseFloat(formData.price),
          inventoryQty: parseInt(formData.inventoryQty),
          unit: formData.unit,
          description: formData.description || null,
          isAvailable: formData.isAvailable,
          // Legacy fields for backwards compatibility
          strainLegacy: formData.strainId ? strains.find(s => s.id === formData.strainId)?.name || null : null,
          categoryLegacy: formData.productType || null,
          subcategoryLegacy: formData.subType || null,
          thcLegacy: formData.thc ? parseFloat(formData.thc) : null,
          cbdLegacy: formData.cbd ? parseFloat(formData.cbd) : null,
          sku: formData.sku || null,
          brand: formData.brand || null,
          ingredients: formData.ingredients || null,
          isFeatured: formData.isFeatured,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update product');
      }

      router.push('/grower/products');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const allProductTypes = [...new Set([...DEFAULT_PRODUCT_TYPES, ...productTypes])];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
        
        {/* Product Name */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-gray-900">
            Product Name *
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Type */}
          <div className="space-y-2">
            <label htmlFor="productType" className="text-sm font-medium text-gray-900">
              Product Type
            </label>
            <select
              id="productType"
              value={formData.productType}
              onChange={(e) => setFormData({ ...formData, productType: e.target.value, subType: '' })}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="">Select a type</option>
              {allProductTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Sub Type */}
          <div className="space-y-2">
            <label htmlFor="subType" className="text-sm font-medium text-gray-900">
              Sub Type
            </label>
            <select
              id="subType"
              value={formData.subType}
              onChange={(e) => setFormData({ ...formData, subType: e.target.value })}
              disabled={!formData.productType}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select a subtype</option>
              {availableSubtypes.map((subtype) => (
                <option key={subtype} value={subtype}>{subtype}</option>
              ))}
            </select>
          </div>

          {/* Strain */}
          <div className="space-y-2">
            <label htmlFor="strain" className="text-sm font-medium text-gray-900">
              Strain
            </label>
            <select
              id="strain"
              value={formData.strainId}
              onChange={(e) => setFormData({ ...formData, strainId: e.target.value, batchId: '' })}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="">Select a strain</option>
              {strains.map((strain) => (
                <option key={strain.id} value={strain.id}>{strain.name}</option>
              ))}
            </select>
          </div>

          {/* Batch */}
          <div className="space-y-2">
            <label htmlFor="batch" className="text-sm font-medium text-gray-900">
              Batch
            </label>
            <select
              id="batch"
              value={formData.batchId}
              onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
              disabled={!formData.strainId && filteredBatches.length === 0}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select a batch</option>
              {filteredBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batchNumber} {batch.strain ? `(${batch.strain.name})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Pricing & Inventory</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Price */}
          <div className="space-y-2">
            <label htmlFor="price" className="text-sm font-medium text-gray-900">
              Price ($) *
            </label>
            <input
              id="price"
              type="number"
              step="0.01"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          {/* Unit */}
          <div className="space-y-2">
            <label htmlFor="unit" className="text-sm font-medium text-gray-900">
              Unit *
            </label>
            <select
              id="unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="gram">Gram</option>
              <option value="eighth">1/8 Oz (3.5g)</option>
              <option value="quarter">1/4 Oz (7g)</option>
              <option value="half">1/2 Oz (14g)</option>
              <option value="ounce">Ounce (28g)</option>
              <option value="pound">Pound (448g)</option>
              <option value="unit">Unit</option>
            </select>
          </div>

          {/* Inventory */}
          <div className="space-y-2">
            <label htmlFor="inventoryQty" className="text-sm font-medium text-gray-900">
              Inventory Quantity *
            </label>
            <input
              id="inventoryQty"
              type="number"
              required
              min="0"
              value={formData.inventoryQty}
              onChange={(e) => setFormData({ ...formData, inventoryQty: e.target.value })}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          {/* SKU */}
          <div className="space-y-2">
            <label htmlFor="sku" className="text-sm font-medium text-gray-900">
              SKU
            </label>
            <input
              id="sku"
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="Enter product SKU"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* THC */}
          <div className="space-y-2">
            <label htmlFor="thc" className="text-sm font-medium text-gray-900">
              THC %
            </label>
            <input
              id="thc"
              type="number"
              step="0.1"
              max="100"
              value={formData.thc}
              onChange={(e) => setFormData({ ...formData, thc: e.target.value })}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          {/* CBD */}
          <div className="space-y-2">
            <label htmlFor="cbd" className="text-sm font-medium text-gray-900">
              CBD %
            </label>
            <input
              id="cbd"
              type="number"
              step="0.1"
              max="100"
              value={formData.cbd}
              onChange={(e) => setFormData({ ...formData, cbd: e.target.value })}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium text-gray-900">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        {/* Brand */}
        <div className="space-y-2">
          <label htmlFor="brand" className="text-sm font-medium text-gray-900">
            Brand
          </label>
          <input
            id="brand"
            type="text"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        {/* Ingredients */}
        <div className="space-y-2">
          <label htmlFor="ingredients" className="text-sm font-medium text-gray-900">
            Ingredients
          </label>
          <textarea
            id="ingredients"
            rows={3}
            value={formData.ingredients}
            onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
            placeholder="List ingredients..."
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Status</h3>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <input
              id="isAvailable"
              type="checkbox"
              checked={formData.isAvailable}
              onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <label htmlFor="isAvailable" className="text-sm font-medium text-gray-900">
              Product is available
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="isFeatured"
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <label htmlFor="isFeatured" className="text-sm font-medium text-gray-900">
              Feature this product
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x border-gray-200-3 border-t pt-6">
        <Button type="button" variant="outline" onClick={() => router.push('/grower/products')}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}

