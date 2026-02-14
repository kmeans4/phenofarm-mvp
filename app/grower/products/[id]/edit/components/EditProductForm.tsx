'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface EditProductFormProps {
  product: {
    id: string;
    name: string;
    strain?: string | null;
    category?: string | null;
    price: number;
    inventoryQty: number;
    unit: string;
    description?: string | null;
    isAvailable: boolean;
  };
  
}

export default function EditProductForm({ product }: EditProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: product?.name || '',
    strain: product?.strain || '',
    category: product?.category || '',
    price: product?.price?.toString() || '',
    inventoryQty: product?.inventoryQty?.toString() || '',
    unit: product?.unit || 'gram',
    description: product?.description || '',
    isAvailable: product?.isAvailable ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/products/${product?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          strain: formData.strain || null,
          category: formData.category || null,
          price: parseFloat(formData.price) || 0,
          inventoryQty: parseInt(formData.inventoryQty) || 0,
          unit: formData.unit,
          description: formData.description || null,
          isAvailable: formData.isAvailable,
        }),
      });

      if (response.ok) {
        router.push('/grower/products');
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update product');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Strain</label>
          <input
            type="text"
            value={formData.strain}
            onChange={(e) => setFormData({ ...formData, strain: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
          <input
            type="number"
            step="0.01"
            required
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Inventory Qty *</label>
          <input
            type="number"
            required
            min="0"
            value={formData.inventoryQty}
            onChange={(e) => setFormData({ ...formData, inventoryQty: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
          <select
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="gram">Gram</option>
            <option value="eighth">1/8 Oz (3.5g)</option>
            <option value="quarter">1/4 Oz (7g)</option>
            <option value="half">1/2 Oz (14g)</option>
            <option value="ounce">Ounce (28g)</option>
            <option value="pound">Pound (448g)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isAvailable"
          checked={formData.isAvailable}
          onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
          className="h-4 w-4"
        />
        <label htmlFor="isAvailable" className="text-sm font-medium text-gray-900">Product is available</label>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <Link href="/grower/products" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Update Product'}
        </button>
      </div>
    </form>
  );
}
