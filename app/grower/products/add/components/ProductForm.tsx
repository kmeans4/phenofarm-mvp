'use client';

import React from 'react';

import { Button } from '@/app/components/ui/Button';

interface ProductFormProps {
  initialData?: {
    id?: string; name?: string;
    strain?: string;
    category?: string;
    subcategory?: string;
    thc?: string;
    cbd?: string;
    price?: string;
    inventoryQty?: string;
    unit?: string;
    description?: string;
    isAvailable?: boolean;
  };
  onSubmit: (data: { name: string; strain: string; category: string; subcategory: string; thc: string; cbd: string; price: string; inventoryQty: string; unit: string; description: string; isAvailable: boolean; }) => void;
  onCancel: () => void;
}

export function ProductForm({ initialData, onSubmit, onCancel }: ProductFormProps) {
  
  const [name, setName] = React.useState(initialData?.name || '');
  const [strain, setStrain] = React.useState(initialData?.strain || '');
  const [category, setCategory] = React.useState(initialData?.category || '');
  const [subcategory, setSubcategory] = React.useState(initialData?.subcategory || '');
  const [thc, setThc] = React.useState(initialData?.thc || '');
  const [cbd, setCbd] = React.useState(initialData?.cbd || '');
  const [price, setPrice] = React.useState(initialData?.price || '');
  const [inventoryQty, setInventoryQty] = React.useState(initialData?.inventoryQty || '');
  const [unit, setUnit] = React.useState(initialData?.unit || 'gram');
  const [description, setDescription] = React.useState(initialData?.description || '');
  const [isAvailable, setIsAvailable] = React.useState(initialData?.isAvailable ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      strain,
      category,
      subcategory,
      thc,
      cbd,
      price,
      inventoryQty,
      unit,
      description,
      isAvailable,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-gray-900">
            Product Name *
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="strain" className="text-sm font-medium text-gray-900">
            Strain
          </label>
          <input
            id="strain"
            type="text"
            value={strain}
            onChange={(e) => setStrain(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium text-gray-900">
            Category
          </label>
          <input
            id="category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="subcategory" className="text-sm font-medium text-gray-900">
            Subcategory
          </label>
          <input
            id="subcategory"
            type="text"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="thc" className="text-sm font-medium text-gray-900">
            THC %
          </label>
          <input
            id="thc"
            type="number"
            step="0.1"
            max="100"
            value={thc}
            onChange={(e) => setThc(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="cbd" className="text-sm font-medium text-gray-900">
            CBD %
          </label>
          <input
            id="cbd"
            type="number"
            step="0.1"
            max="100"
            value={cbd}
            onChange={(e) => setCbd(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="price" className="text-sm font-medium text-gray-900">
            Price ($) *
          </label>
          <input
            id="price"
            type="number"
            step="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="inventoryQty" className="text-sm font-medium text-gray-900">
            Inventory Quantity *
          </label>
          <input
            id="inventoryQty"
            type="number"
            required
            min="0"
            value={inventoryQty}
            onChange={(e) => setInventoryQty(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="unit" className="text-sm font-medium text-gray-900">
            Unit *
          </label>
          <select
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value="gram">Gram</option>
            <option value="eighth">1/8 Oz (3.5g)</option>
            <option value="quarter">1/4 Oz (7g)</option>
            <option value="half">1/2 Oz (14g)</option>
            <option value="ounce">Ounce (28g)</option>
            <option value="pound">Pound (448g)</option>
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="description" className="text-sm font-medium text-gray-900">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div className="flex items-center space-x-2 md:col-span-2">
          <input
            id="isAvailable"
            type="checkbox"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <label htmlFor="isAvailable" className="text-sm font-medium text-gray-900">
            Product is currently available
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {initialData?.id ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}

export default ProductForm;
