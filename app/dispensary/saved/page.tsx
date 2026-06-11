import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import SavedContent from './SavedContent';

export const metadata = {
  title: 'Saved | PhenoFarm',
  description: 'Buyer saved products, price alerts, and recent order requests',
};

export default async function SavedPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as { role?: string; dispensaryId?: string };

  if (user.role !== 'DISPENSARY' || !user.dispensaryId) {
    redirect('/dashboard');
  }

  const orders = await db.order.findMany({
    where: { dispensaryId: user.dispensaryId },
    include: {
      grower: { select: { id: true, businessName: true } },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              unit: true,
              price: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const recentMap = new Map<string, {
    productId: string;
    name: string;
    growerName: string;
    growerId: string;
    unit: string | null;
    price: number;
    lastOrderedAt: string;
    orderCount: number;
  }>();

  for (const order of orders) {
    for (const item of order.items) {
      const productId = item.product?.id || item.productId;
      const existing = recentMap.get(productId);

      if (existing) {
        existing.orderCount += 1;
        continue;
      }

      recentMap.set(productId, {
        productId,
        name: item.product?.name || 'Unknown product',
        growerName: order.grower?.businessName || 'Unknown grower',
        growerId: order.grower?.id || order.growerId,
        unit: item.product?.unit || null,
        price: Number(item.unitPrice || item.product?.price || 0),
        lastOrderedAt: order.createdAt.toISOString(),
        orderCount: 1,
      });
    }
  }

  return <SavedContent recentProducts={Array.from(recentMap.values()).slice(0, 10)} />;
}
