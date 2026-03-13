import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import EditProductPageClient from './components/EditProductPageClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user;
  if (user?.role !== 'GROWER') {
    redirect('/dashboard');
  }

  const { id } = await params;

  const product = await db.product.findFirst({
    where: { id, growerId: user.growerId },
  });

  if (!product) {
    redirect('/grower/products');
  }

  const initialData = {
    id: product.id,
    name: product.name || '',
    productType: product.productType || '',
    subType: product.subType || '',
    strainId: product.strainId || '',
    batchId: product.batchId || '',
    price: product.price ? String(Number(product.price)) : '',
    inventoryQty: product.inventoryQty !== null && product.inventoryQty !== undefined ? String(product.inventoryQty) : '0',
    unit: product.unit || 'Gram',
    description: product.description || '',
    isAvailable: product.isAvailable ?? true,
    images: product.images || [],
    sku: product.sku || '',
    brand: product.brand || '',
    ingredients: product.ingredients || '',
    isFeatured: product.isFeatured || false,
  };

  return <EditProductPageClient productId={product.id} initialData={initialData} />;
}
