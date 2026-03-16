'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProductForm } from '../components/ProductForm';
import { buildProductRequestPayload, PRODUCT_STATUS } from '@/lib/product-payload';

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

  const [initialData, setInitialData] = useState<Partial<ProductFormData>>({
    strainId: prefillStrainId || undefined,
    batchId: prefillBatchId || undefined,
  });

  useEffect(() => {
    const fetchGrowerInfo = async () => {
      try {
        const response = await fetch('/api/growers/me');
        if (response.ok) {
          const data = await response.json();
          setGrowerInfo(data);
        }

        if (typeof window !== 'undefined') {
          const savedDraft = window.sessionStorage.getItem('addProductDraft');
          if (savedDraft) {
            try {
              const parsed = JSON.parse(savedDraft);
              const shouldRestore = window.confirm('You have an unsaved product draft. Restore it?');
              if (shouldRestore) {
                setInitialData(parsed);
              } else {
                window.sessionStorage.removeItem('addProductDraft');
              }
            } catch {
              window.sessionStorage.removeItem('addProductDraft');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching grower info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrowerInfo();
  }, [prefillStrainId, prefillBatchId]);

  const saveProduct = async (formData: ProductFormData, status: 'DRAFT' | 'PUBLISHED') => {
    const payload = buildProductRequestPayload(formData as unknown as Record<string, unknown>, status);

    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to save product');
    }

    return response.json();
  };

  const handleSubmit = async (formData: ProductFormData) => {
    try {
      await saveProduct(formData, PRODUCT_STATUS.PUBLISHED);
      alert('Product created successfully!');
      router.push('/grower/products');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleSaveDraft = async (formData: ProductFormData) => {
    try {
      await saveProduct(formData, PRODUCT_STATUS.DRAFT);
      alert('Draft saved successfully!');
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600 mt-1">Create a new cannabis product listing</p>
        </div>
      </div>
      <ProductForm 
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        onCancel={() => router.push('/grower/products')}
        growerBrand={growerInfo?.businessName}
        initialData={initialData}
      />
    </div>
  );
}
