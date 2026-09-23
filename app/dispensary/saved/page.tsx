import { getAuthSession } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import SavedContent from './SavedContent';

type SavedTab = 'favorites' | 'alerts' | 'recent';

export const metadata = {
  title: 'Saved | PhenoFarm',
  description: 'Buyer saved products, price alerts, and recent order requests',
};

function parseSavedTab(tab: unknown): SavedTab {
  const value = Array.isArray(tab) ? tab[0] : tab;
  return value === 'alerts' || value === 'recent' || value === 'favorites' ? value : 'favorites';
}

async function countSavedFavorites(dispensaryId: string) {
  try {
    return await db.dispensaryFavoriteProduct.count({ where: { dispensaryId } });
  } catch (error) {
    console.warn('Unable to count saved favorite products:', error);
    return 0;
  }
}

async function countPriceAlerts(dispensaryId: string) {
  try {
    return await db.dispensaryPriceAlert.count({ where: { dispensaryId } });
  } catch (error) {
    console.warn('Unable to count saved price alerts:', error);
    return 0;
  }
}

interface SavedPageProps {
  searchParams?: Promise<{ tab?: string | string[] }>;
}

export default async function SavedPage({ searchParams }: SavedPageProps) {
  const session = await getAuthSession();

  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as { role?: string; dispensaryId?: string };

  if (user.role !== 'DISPENSARY' || !user.dispensaryId) {
    redirect('/dashboard');
  }

  const params = searchParams ? await searchParams : {};
  const initialTab = parseSavedTab(params.tab);

  const [orders, favoriteCount, priceAlertCount] = await Promise.all([
    db.order.findMany({
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
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    countSavedFavorites(user.dispensaryId),
    countPriceAlerts(user.dispensaryId),
  ]);

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
    const seenProducts = new Set<string>();
    for (const item of order.items) {
      if (seenProducts.has(item.productId)) continue;
      seenProducts.add(item.productId);
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
        price: Number(item.unitPrice),
        lastOrderedAt: order.createdAt.toISOString(),
        orderCount: 1,
      });
    }
  }

  const recentProducts = Array.from(recentMap.values()).slice(0, 10);

  return (
    <SavedContent
      initialTab={initialTab}
      counts={{
        favorites: favoriteCount,
        alerts: priceAlertCount,
        recent: recentProducts.length,
      }}
      recentProducts={recentProducts}
    />
  );
}
