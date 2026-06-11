'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProductForm } from '../components/ProductForm';
import { buildProductRequestPayload, PRODUCT_STATUS } from '@/lib/product-payload';
import { toast } from '@/app/hooks/useToast';

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
  isPriceVisible: boolean;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftToRestore, setDraftToRestore] = useState<Partial<ProductFormData> | null>(null);
  const [formVersion, setFormVersion] = useState(0);

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
              setDraftToRestore(parsed);
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
      setIsSubmitting(true);
      await saveProduct(formData, PRODUCT_STATUS.PUBLISHED);
      toast.success('Product published');
      router.push('/grower/products');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (formData: ProductFormData) => {
    try {
      setIsSubmitting(true);
      await saveProduct(formData, PRODUCT_STATUS.DRAFT);
      toast.success('Draft saved');
      router.push('/grower/products');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="mt-1 text-gray-600">Loading product form...</p>
        </div>
        <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-gray-200 bg-white">
          <div className="text-gray-500">Loading...</div>
        </div>
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
      {draftToRestore && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-900">Unsaved product draft found</p>
              <p className="mt-1 text-sm text-amber-800">Restore the browser draft or discard it and start fresh.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setInitialData(draftToRestore);
                  setFormVersion((version) => version + 1);
                  setDraftToRestore(null);
                  toast.success('Draft restored');
                }}
                className="rounded-md bg-amber-700 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-800"
              >
                Restore
              </button>
              <button
                type="button"
                onClick={() => {
                  window.sessionStorage.removeItem('addProductDraft');
                  setDraftToRestore(null);
                }}
                className="rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
      <ProductForm 
        key={formVersion}
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        onCancel={() => router.push('/grower/products')}
        growerBrand={growerInfo?.businessName}
        initialData={initialData}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
