'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { Button } from '@/app/components/ui/Button';
import { format } from 'date-fns';

interface ProductTableProps {
  products: {
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
  }[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleAvailability: (id: string) => void;
  onSort: (field: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const columns = [
  { key: 'name', label: 'Product Name' },
  { key: 'category', label: 'Category' },
  { key: 'price', label: 'Price' },
  { key: 'inventoryQty', label: 'Inventory' },
  { key: 'isAvailable', label: 'Status' },
];

export function ProductTable({ 
  products, 
  onEdit, 
  onDelete, 
  onToggleAvailability,
  onSort,
  sortBy = 'createdAt',
  sortOrder = 'desc'
}: ProductTableProps) {
  const [filteredProducts, setFilteredProducts] = useState(products);

  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  const handleSort = (key: string) => {
    const _currentSortOrder = sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(key);
    // Note: The actual sorting is handled in the parent component
  };

  if (filteredProducts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
            <p className="text-gray-600 mb-4">No products found</p>
            <p className="text-sm text-gray-500">Add your first product to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Products</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                {columns.map((col) => (
                  <th 
                    key={col.key}
                    className="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortBy === col.key && (
                        <span className="text-gray-400">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      {product.strain && (
                        <p className="text-sm text-gray-500">{product.strain}</p>
                      )}
                      {product.category && (
                        <p className="text-xs text-gray-400 mt-1">{product.category}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {product.category || '-'}
                  </td>
                  <td className="px-4 py-3">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-gray-900">{product.inventoryQty}</span>
                      <span className="text-xs text-gray-500">{product.unit}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={product.isAvailable ? 'success' : 'error'}>
                      {product.isAvailable ? 'Available' : 'Unavailable'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="text-xs py-1"
                        onClick={() => onEdit(product.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        className="text-xs py-1"
                        onClick={() => onToggleAvailability(product.id)}
                      >
                        {product.isAvailable ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="destructive"
                        className="text-xs py-1"
                        onClick={() => onDelete(product.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
