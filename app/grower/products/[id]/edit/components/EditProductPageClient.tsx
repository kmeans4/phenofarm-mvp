'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ProductForm } from '@/app/grower/products/components/ProductForm';
import { buildProductRequestPayload, PRODUCT_STATUS } from '@/lib/product-payload';
import { toast } from '@/app/hooks/useToast';
import { PageHeader } from '@/app/components/ui/PageHeader';

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
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update product');
      }

      toast.success('Product updated');
      router.push('/grower/products');
    } catch (err: unknown) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-3 sm:space-y-6">
      <div className="space-y-3">
        <Link
          href="/grower/products"
          className="inline-flex items-center gap-2 rounded-md px-1 py-1 text-sm font-medium text-green-700 hover:text-green-800 hover:bg-green-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Products
        </Link>

        <PageHeader title="Edit product" />
      </div>

      <ProductForm
        onSubmit={handleSubmit}
        onCancel={() => router.push('/grower/products')}
        initialData={initialData}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
