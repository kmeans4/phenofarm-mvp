import { getAuthSession } from '@/lib/auth-helpers';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db';
import EditProductPageClient from './components/EditProductPageClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const session = await getAuthSession();

  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user;
  if (user?.role !== 'GROWER' || !user.growerId) {
    redirect('/dashboard');
  }

  const { id } = await params;

  const product = await db.product.findFirst({
    where: { id, growerId: user.growerId, isDeleted: false },
  });

  if (!product) {
    notFound();
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
    isPriceVisible: product.isPriceVisible ?? true,
    images: product.images || [],
    sku: product.sku || '',
    brand: product.brand || '',
    ingredients: product.ingredients || '',
    isFeatured: product.isFeatured || false,
    thcMin: product.thcMin?.toString() || '', thcMax: product.thcMax?.toString() || '',
    cbdMin: product.cbdMin?.toString() || '', cbdMax: product.cbdMax?.toString() || '',
    harvestDate: product.harvestDate?.toISOString().slice(0, 10) || '',
  };

  return <EditProductPageClient productId={product.id} initialData={initialData} />;
}
