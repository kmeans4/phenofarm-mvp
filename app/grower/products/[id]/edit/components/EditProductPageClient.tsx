'use client';

import { useRouter } from 'next/navigation';
import { ProductForm } from '@/app/grower/products/components/ProductForm';

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
      const productData = {
        name: formData.name,
        productType: formData.productType || null,
        subType: formData.subType || null,
        strainId: formData.strainId || null,
        batchId: formData.batchId || null,
        price: parseFloat(formData.price),
        inventoryQty: parseInt(formData.inventoryQty, 10),
        unit: formData.unit,
        description: formData.description || null,
        images: formData.images || [],
        isAvailable: formData.isAvailable,
        sku: formData.sku || null,
        brand: formData.brand || null,
        ingredients: formData.ingredients || null,
        isFeatured: formData.isFeatured || false,
      };

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update product');
      }

      alert('Product updated successfully!');
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
        onCancel={() => router.push('/grower/products')}
        initialData={initialData}
      />
    </div>
  );
}
