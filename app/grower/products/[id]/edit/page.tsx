'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { ProductForm } from './components/ProductForm';

interface Product {
  id: string;
  name: string;
  strain: string | null;
  category: string | null;
  subcategory: string | null;
  thc: number | null;
  cbd: number | null;
  price: string;
  inventoryQty: number;
  unit: string;
  description: string | null;
  images: string[];
  isAvailable: boolean;
  createdAt: string;
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<Partial<any>>({});

  const router = useRouter();
  const [productId, setProductId] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      const p = await params;
      setProductId(p.id);
    };
    init();
  }, [params]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const session = await getServerSession(authOptions);
        if (!session) {
          redirect('/auth/sign_in');
        }

        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }

        const data: Product = await response.json();

        setInitialData({
          id: data.id,
          name: data.name,
          strain: data.strain || '',
          category: data.category || '',
          subcategory: data.subcategory || '',
          thc: data.thc !== null ? data.thc.toString() : '',
          cbd: data.cbd !== null ? data.cbd.toString() : '',
          price: data.price,
          inventoryQty: data.inventoryQty.toString(),
          unit: data.unit,
          description: data.description || '',
          images: data.images,
          isAvailable: data.isAvailable,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load product');
      }
    };

    fetchProduct();
  }, [productId]);

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
        images: initialData.images || [],
        isAvailable: formData.isAvailable,
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
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    }
  };

  if (!productId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-600 mt-1">Update your product details</p>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!initialData.id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  return <ProductForm initialData={initialData} onSubmit={handleSubmit} onCancel={() => router.push('/grower/products')} />;
}
