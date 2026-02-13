'use client';

import { useRouter } from 'next/navigation';
import { ProductForm } from './components/ProductForm';

export default function AddProductPage() {
  const router = useRouter();

  const handleSubmit = async (formData: any) => {
    try {
      const productData = {
        name: formData.name,
        strain: formData.strain || null,
        category: formData.category || null,
        subcategory: formData.subcategory || null,
        thc: formData.thc ? parseFloat(formData.thc) : null,
        cbd: formData.cbd ? parseFloat(formData.cbd) : null,
        price: parseFloat(formData.price),
        inventoryQty: parseInt(formData.inventoryQty),
        unit: formData.unit,
        description: formData.description || null,
        images: [],
        isAvailable: formData.isAvailable,
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
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600 mt-1">Create a new cannabis product listing</p>
        </div>
      </div>
      <ProductForm onSubmit={handleSubmit} onCancel={() => router.push('/grower/products')} />
    </div>
  );
}
