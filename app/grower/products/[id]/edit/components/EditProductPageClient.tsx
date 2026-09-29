'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ProductForm } from '@/app/grower/products/components/ProductForm';
import {
  buildProductRequestPayload,
  PRODUCT_STATUS,
} from '@/lib/product-payload';
import { toast } from '@/app/hooks/useToast';
import { PageHeader } from '@/app/components/ui/PageHeader';

interface ProductFormData {
  id?: string;
  status?: 'DRAFT' | 'PUBLISHED';
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

export default function EditProductPageClient({
  productId,
  initialData,
}: EditProductPageClientProps) {
  const router = useRouter();
  const params = useSearchParams();
  const requestedReturn = params?.get('returnTo');
  const returnTo =
    requestedReturn?.startsWith('/grower/products') &&
    !requestedReturn.startsWith('//')
      ? requestedReturn
      : '/grower/products';
  const [isSubmitting, setIsSubmitting] = useState(false);

  const saveProduct = async (
    formData: ProductFormData,
    status: 'DRAFT' | 'PUBLISHED'
  ) => {
    try {
      setIsSubmitting(true);
      const payload = buildProductRequestPayload(
        formData as unknown as Record<string, unknown>,
        status
      );

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw Object.assign(
          new Error(
            data.error || 'We could not update product. Please try again.'
          ),
          { errors: data.errors || data.details || [] }
        );
      }

      const saved = await response.json();
      toast.success(
        status === PRODUCT_STATUS.DRAFT
          ? 'Draft saved'
          : Number(saved.inventoryQty) === 0
            ? 'Saved but hidden: no stock'
            : saved.isAvailable
              ? 'Product is live'
              : 'Product saved hidden'
      );
      router.push(returnTo);
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
          href={returnTo}
          className="inline-flex items-center gap-2 rounded-md px-1 py-1 text-sm font-medium text-pf-accent hover:text-pf-accent hover:bg-pf-accent-bg"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Products
        </Link>

        <PageHeader
          title="Edit product"
          actions={
            <>
              <Link
                className="inline-flex min-h-11 items-center rounded-lg border border-pf-line-strong px-3 text-sm"
                href={`/grower/products/${productId}/preview`}
              >
                Preview as buyer
              </Link>
              <Link
                className="inline-flex min-h-11 items-center rounded-lg border border-pf-line-strong px-3 text-sm"
                href={`/grower/products/add?duplicate=${productId}&returnTo=${encodeURIComponent(returnTo)}`}
              >
                Duplicate
              </Link>
              <button
                type="button"
                className="min-h-11 rounded-lg border border-pf-danger-line px-3 text-sm text-pf-danger"
                onClick={async () => {
                  const response = await fetch(`/api/products/${productId}`, {
                    method: 'DELETE',
                  });
                  if (!response.ok) {
                    toast.error('Could not delete product.');
                    return;
                  }
                  toast.success('Moved to Recently deleted', {
                    duration: 10000,
                    action: {
                      label: 'Undo',
                      onClick: () => {
                        void fetch(`/api/products/${productId}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ restore: true }),
                        })
                          .then((response) => {
                            if (!response.ok) throw new Error('Restore failed');
                            router.refresh();
                          })
                          .catch(() =>
                            toast.error(
                              'Could not restore. Open Recently deleted and retry.'
                            )
                          );
                      },
                    },
                  });
                  router.push(returnTo);
                }}
              >
                Delete
              </button>
            </>
          }
        />
      </div>

      <ProductForm
        onSubmit={(data) => saveProduct(data, PRODUCT_STATUS.PUBLISHED)}
        onSaveDraft={
          initialData.status === 'DRAFT'
            ? (data) => saveProduct(data, PRODUCT_STATUS.DRAFT)
            : undefined
        }
        onCancel={() => router.push(returnTo)}
        initialData={initialData}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
