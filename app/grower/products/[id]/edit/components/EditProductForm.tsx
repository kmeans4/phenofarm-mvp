'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface EditProductFormProps {
  product: {
    id: string;
    name: string;
    strain?: string | null;
    strainId?: string | null;
    batchId?: string | null;
    batchNumber?: string | null;
    productType?: string | null;
    subType?: string | null;
    categoryLegacy?: string | null;
    price: number;
    inventoryQty: number;
    unit: string;
    description?: string | null;
    isAvailable: boolean;
    thc?: number | null;
    cbd?: number | null;
  };
  
}

// Consistent input styles - h-10 matches text inputs
const INPUT_CLASSES = "w-full h-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent";

export default function EditProductForm({ product }: EditProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Use new schema fields or fall back to legacy
  const [formData, setFormData] = useState({
    name: product?.name || '',
    strain: product?.strain || product?.strainId || '',
    productType: product?.productType || product?.categoryLegacy || '',
    subType: product?.subType || '',
    price: product?.price?.toString() || '',
    inventoryQty: product?.inventoryQty?.toString() || '',
    unit: product?.unit || 'gram',
    description: product?.description || '',
    isAvailable: product?.isAvailable ?? true,
    thc: product?.thc?.toString() || '',
    cbd: product?.cbd?.toString() || '',
  });

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
          price: parseFloat(formData.price),
          inventoryQty: parseInt(formData.inventoryQty),
          unit: formData.unit,
          description: formData.description || null,
          isAvailable: formData.isAvailable,
          // Legacy fields for backwards compatibility
          strain: formData.strain || null,
          category: formData.productType || null,
          subcategory: formData.subType || null,
          thc: formData.thc ? parseFloat(formData.thc) : null,
          cbd: formData.cbd ? parseFloat(formData.cbd) : null,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={INPUT_CLASSES}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className={INPUT_CLASSES}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className={INPUT_CLASSES}
            >
              <option value="gram">gram</option>
              <option value="ounce">ounce</option>
              <option value="pound">pound</option>
              <option value="unit">unit</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inventory</label>
            <input
              type="number"
              value={formData.inventoryQty}
              onChange={(e) => setFormData({ ...formData, inventoryQty: e.target.value })}
              className={INPUT_CLASSES}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
            <input
              type="text"
              value={formData.productType}
              onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
              className={INPUT_CLASSES}
              placeholder="e.g., Flower, Edibles"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isAvailable"
            checked={formData.isAvailable}
            onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
            className="h-4 w-4 text-green-600 border-gray-300 rounded"
          />
          <label htmlFor="isAvailable" className="ml-2 text-sm text-gray-700">
            Available for purchase
          </label>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 h-10"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
        <Link
          href="/grower/products"
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 h-10 flex items-center justify-center"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
