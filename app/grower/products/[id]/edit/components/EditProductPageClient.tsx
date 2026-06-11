'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ProductForm } from '@/app/grower/products/components/ProductForm';
import { buildProductRequestPayload, PRODUCT_STATUS } from '@/lib/product-payload';
import { toast } from '@/app/hooks/useToast';

interface ProductFormData {
  id?: string;
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

interface EditProductPageClientProps {
  productId: string;
  initialData: Partial<ProductFormData>;
}

export default function EditProductPageClient({ productId, initialData }: EditProductPageClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: ProductFormData) => {
    try {
      setIsSubmitting(true);
      const payload = buildProductRequestPayload(
        formData as unknown as Record<string, unknown>,
        PRODUCT_STATUS.PUBLISHED
      );

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update product');
      }

      toast.success('Product updated');
      router.push('/grower/products');
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (formData: ProductFormData) => {
    try {
      setIsSubmitting(true);
      const payload = buildProductRequestPayload(
        formData as unknown as Record<string, unknown>,
        PRODUCT_STATUS.DRAFT
      );

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save draft');
      }

      toast.success('Draft saved');
      router.push('/grower/products');
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6">
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => router.push('/grower/products')}
          className="inline-flex items-center gap-2 rounded-md px-1 py-1 text-sm font-medium text-green-700 hover:text-green-800 hover:bg-green-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Products
        </button>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Update your product details</p>
        </div>
      </div>

      <ProductForm
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        onCancel={() => router.push('/grower/products')}
        initialData={initialData}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
