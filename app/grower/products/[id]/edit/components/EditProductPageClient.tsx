'use client';

import { useRouter } from 'next/navigation';
import { ProductForm } from '@/app/grower/products/components/ProductForm';
import { buildProductRequestPayload, PRODUCT_STATUS } from '@/lib/product-payload';

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

  const handleSubmit = async (formData: ProductFormData) => {
    try {
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

      router.push('/grower/products');
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleSaveDraft = async (formData: ProductFormData) => {
    try {
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

      router.push('/grower/products');
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-600 mt-1">Update your product details</p>
        </div>
      </div>

      <ProductForm
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        onCancel={() => router.push('/grower/products')}
        initialData={initialData}
      />
    </div>
  );
}
