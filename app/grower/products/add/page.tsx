'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { ProductForm } from '../components/ProductForm';
import { buildProductRequestPayload, PRODUCT_STATUS } from '@/lib/product-payload';
import { toast } from '@/app/hooks/useToast';
import { PageHeader } from '@/app/components/ui/PageHeader';

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
  const initialData = useMemo<Partial<ProductFormData>>(() => ({
    strainId: prefillStrainId || undefined,
    batchId: prefillBatchId || undefined,
  }), [prefillStrainId, prefillBatchId]);

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

  const saveProduct = async (formData: ProductFormData, status: 'DRAFT' | 'PUBLISHED') => {
    const payload = buildProductRequestPayload(formData as unknown as Record<string, unknown>, status);

    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
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
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (formData: ProductFormData) => {
    try {
      setIsSubmitting(true);
      await saveProduct(formData, PRODUCT_STATUS.DRAFT);
      router.push('/grower/products');
    } catch (err: unknown) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <PageHeader title="Add product" />
        <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-pf-line bg-pf-surface">
          <div className="text-pf-muted">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-3 sm:space-y-6">
      <PageHeader title="Add product" />
      <ProductForm 
        key={`${prefillStrainId || ''}:${prefillBatchId || ''}`}
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
