'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { Button } from '@/app/components/ui/Button';
import Link from 'next/link';
import { format } from 'date-fns';

interface ProductCardProps {
  product: {
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
  };
  onEdit: () => void;
  onDelete: () => void;
  onToggleAvailability: () => void;
}

export function ProductCard({ product, onEdit, onDelete, onToggleAvailability }: ProductCardProps) {
  return (
    <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
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
          <Button 
            variant="outline" 
            className="text-sm py-2 flex-1"
            onClick={onEdit}
          >
            Edit
          </Button>
          <Button
            variant="secondary"
            className="text-sm py-2 flex-1"
            onClick={onToggleAvailability}
          >
            {product.isAvailable ? 'Disable' : 'Enable'}
          </Button>
          <Button
            variant="destructive"
            className="text-sm py-2"
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
