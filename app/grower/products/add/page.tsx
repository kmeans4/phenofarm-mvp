'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProductForm } from '../components/ProductForm';

interface ProductFormData {
  name: string;
  productType: string;
  subType: string;
  strainId: string;
  batchId: string;
  price: string;
  inventoryQty: string;
  unit: string;
  description: string;
  isAvailable: boolean;
  images: string[];
  sku: string;
  brand: string;
  ingredients: string;
  isFeatured: boolean;
}

interface GrowerInfo {
  businessName: string;
}

export default function AddProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillStrainId = searchParams?.get('strainId');
  const prefillBatchId = searchParams?.get('batchId');
  const [growerInfo, setGrowerInfo] = useState<GrowerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrowerInfo = async () => {
      try {
        const response = await fetch('/api/growers/me');
        if (response.ok) {
          const data = await response.json();
          setGrowerInfo(data);
        }
      } catch (error) {
        console.error('Error fetching grower info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrowerInfo();
  }, []);

  const handleSubmit = async (formData: ProductFormData) => {
    try {
      const productData = {
        name: formData.name,
        productType: formData.productType || null,
        subType: formData.subType || null,
        strainId: formData.strainId || null,
        batchId: formData.batchId || null,
        price: parseFloat(formData.price),
        inventoryQty: parseInt(formData.inventoryQty),
        unit: formData.unit,
        description: formData.description || null,
        images: formData.images || [],
        isAvailable: formData.isAvailable,
        sku: formData.sku || null,
        brand: formData.brand || null,
        ingredients: formData.ingredients || null,
        isFeatured: formData.isFeatured || false,
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

      alert('Product created successfully!');
      router.push('/grower/products');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600 mt-1">Create a new cannabis product listing</p>
        </div>
      </div>
      <ProductForm 
        onSubmit={handleSubmit} 
        onCancel={() => router.push('/grower/products')}
        growerBrand={growerInfo?.businessName}
        initialData={{
          strainId: prefillStrainId || undefined,
          batchId: prefillBatchId || undefined,
        }}
      />
    </div>
  );
}
