import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { marketplaceGrowerWhere } from '@/lib/license';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';
    
    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results: Array<{
      id: string;
      type: string;
      title: string;
      subtitle?: string;
      href: string;
    }> = [];

    // Search based on user role
    if (user.role === 'GROWER' && user.growerId) {
      const [products, orders, customers, strains] = await Promise.all([
        db.product.findMany({
        where: {
          growerId: user.growerId,
          isDeleted: false,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { productType: { contains: query, mode: 'insensitive' } },
            { strain: { name: { contains: query, mode: 'insensitive' } } },
          ],
        },
        select: {
          id: true,
          name: true,
          productType: true,
          inventoryQty: true,
        },
        take: 5,
      }),
        db.order.findMany({
        where: {
          growerId: user.growerId,
          OR: [
            { orderId: { contains: query, mode: 'insensitive' } },
            { dispensary: { businessName: { contains: query, mode: 'insensitive' } } },
          ],
        },
        select: {
          id: true,
          orderId: true,
          status: true,
          totalAmount: true,
          dispensary: { select: { businessName: true } },
        },
        take: 5,
      }),
        db.dispensary.findMany({
        where: {
          orders: { some: { growerId: user.growerId } },
          OR: [
            { businessName: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          businessName: true,
          city: true,
          state: true,
        },
        take: 5,
      }),
        db.strain.findMany({
        where: {
          growerId: user.growerId,
          name: { contains: query, mode: 'insensitive' },
        },
        select: {
          id: true,
          name: true,
          genetics: true,
        },
        take: 5,
      }),
      ]);
      // Search Products


      products.forEach(p => {
        results.push({
          id: p.id,
          type: 'product',
          title: p.name,
          subtitle: `${p.productType} • ${p.inventoryQty} in stock`,
          href: `/grower/products/${p.id}/edit`,
        });
      });

      // Search Orders


      orders.forEach(o => {
        results.push({
          id: o.id,
          type: 'order',
          title: `Order #${o.orderId}`,
          subtitle: `${o.dispensary.businessName} • ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(o.totalAmount))} • ${o.status}`,
          href: `/grower/orders/${o.id}`,
        });
      });

      // Search Customers (Dispensaries that have ordered)


      customers.forEach(c => {
        results.push({
          id: c.id,
          type: 'customer',
          title: c.businessName,
          subtitle: [c.city, c.state].filter(Boolean).join(', ') || 'Customer',
          href: `/grower/customers/${c.id}/edit`,
        });
      });

      // Search Strains


      strains.forEach(s => {
        results.push({
          id: s.id,
          type: 'strain',
          title: s.name,
          subtitle: s.genetics || 'No genetics specified',
          href: `/grower/strains/${s.id}/edit`,
        });
      });

    } else if (user.role === 'DISPENSARY' && user.dispensaryId) {
      const [products, orders] = await Promise.all([
        db.product.findMany({
        where: {
          isAvailable: true,
          isDeleted: false,
          status: 'PUBLISHED',
          inventoryQty: { gt: 0 },
          grower: marketplaceGrowerWhere(),
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { productType: { contains: query, mode: 'insensitive' } },
            { strain: { name: { contains: query, mode: 'insensitive' } } },
            { grower: { businessName: { contains: query, mode: 'insensitive' } } },
          ],
        },
        select: {
          id: true,
          name: true,
          productType: true,
          price: true,
          isPriceVisible: true,
          grower: {
            select: {
              id: true,
              businessName: true,
            },
          },
        },
        take: 5,
      }),
        db.order.findMany({
        where: {
          dispensaryId: user.dispensaryId,
          OR: [
            { orderId: { contains: query, mode: 'insensitive' } },
            { grower: { businessName: { contains: query, mode: 'insensitive' } } },
          ],
        },
        select: {
          id: true,
          orderId: true,
          status: true,
          totalAmount: true,
          grower: { select: { businessName: true } },
        },
        take: 5,
      }),
      ]);
      // Search Products for Dispensary view


      products.forEach(p => {
        results.push({
          id: p.id,
          type: 'product',
          title: p.name,
          subtitle: `${p.productType || 'Product'} • ${p.isPriceVisible ? `$${Number(p.price).toFixed(2)}` : 'Request pricing'} • ${p.grower.businessName}`,
          href: `/dispensary/catalog?search=${encodeURIComponent(p.name)}&product=${encodeURIComponent(p.id)}`,
        });
      });

      // Search Orders


      orders.forEach(o => {
        results.push({
          id: o.id,
          type: 'order',
          title: `Order #${o.orderId}`,
          subtitle: `${o.grower.businessName} • ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(o.totalAmount))} • ${o.status}`,
          href: `/dispensary/orders/${o.id}`,
        });
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
