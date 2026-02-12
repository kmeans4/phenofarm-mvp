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

      // Show success message
      alert('Product created successfully!');
      router.push('/grower/products');
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    }
  };

  return <ProductForm onSubmit={handleSubmit} onCancel={() => router.push('/grower/products')} />;
}
