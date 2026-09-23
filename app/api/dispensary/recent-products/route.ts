import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { marketplaceGrowerWhere } from '@/lib/license';

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    if (user.role !== 'DISPENSARY' || !user.dispensaryId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const orders = await db.order.findMany({
      where: { dispensaryId: user.dispensaryId, grower: marketplaceGrowerWhere() },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        grower: {
          select: {
            id: true,
            businessName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                isPriceVisible: true,
                unit: true,
                inventoryQty: true,
                isAvailable: true,
                isDeleted: true,
                status: true,
                thcMin: true,
                thcMax: true,
                strain: {
                  select: {
                    name: true,
                  },
                },
                batch: {
                  select: {
                    thc: true,
                  },
                },
                grower: {
                  select: {
                    id: true,
                    businessName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const recentProducts = new Map<string, {
      id: string;
      name: string;
      price: number | null;
      isPriceVisible: boolean;
      strain: string | null;
      unit: string | null;
      thc: number | null;
      inventoryQty: number;
      grower: {
        id: string;
        businessName: string;
      };
      orderCount: number;
      lastOrderedAt: string;
    }>();

    for (const order of orders) {
      const seenProducts = new Set<string>();
    for (const item of order.items) {
      if (seenProducts.has(item.productId)) continue;
      seenProducts.add(item.productId);
        const product = item.product;

        if (!product || product.isDeleted || product.status !== 'PUBLISHED' || !product.isAvailable || product.inventoryQty < 1) {
          continue;
        }

        const existing = recentProducts.get(product.id);
        if (existing) {
          existing.orderCount += 1;
          continue;
        }

        recentProducts.set(product.id, {
          id: product.id,
          name: product.name,
          price: product.isPriceVisible ? Number(product.price) : null,
          isPriceVisible: product.isPriceVisible,
          strain: product.strain?.name || null,
          unit: product.unit,
          thc: product.batch?.thc != null
            ? Number(product.batch.thc)
            : product.thcMax != null
              ? Number(product.thcMax)
              : product.thcMin != null
                ? Number(product.thcMin)
                : null,
          inventoryQty: product.inventoryQty,
          grower: {
            id: product.grower?.id || order.grower?.id || item.growerId,
            businessName: product.grower?.businessName || order.grower?.businessName || 'Unknown grower',
          },
          orderCount: 1,
          lastOrderedAt: order.createdAt.toISOString(),
        });
      }
    }

    return NextResponse.json({ products: Array.from(recentProducts.values()).slice(0, 8) });
  } catch (error) {
    console.error('Error loading recent request products:', error);
    return NextResponse.json({ error: 'Failed to load recent request products' }, { status: 500 });
  }
}
