import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { formatMoney } from '@/lib/format';
import { ORDER_STATUS_LABELS } from '@/lib/order-workflow';
import { marketplaceGrowerWhere } from '@/lib/license';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Please sign in to continue.' },
        { status: 401 }
      );
    }

    const user = session.user;
    const { searchParams } = new URL(request.url);
    const query =
      searchParams.get('q')?.trim().toLowerCase().slice(0, 200) || '';

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
              {
                dispensary: {
                  businessName: { contains: query, mode: 'insensitive' },
                },
              },
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

      products.forEach((p) => {
        results.push({
          id: p.id,
          type: 'product',
          title: p.name,
          subtitle: `${p.productType} • ${p.inventoryQty} in stock`,
          href: `/grower/products/${p.id}/edit`,
        });
      });

      // Search Orders

      orders.forEach((o) => {
        results.push({
          id: o.id,
          type: 'order',
          title: `Order #${o.orderId}`,
          subtitle: `${o.dispensary.businessName} • ${formatMoney(o.totalAmount)} • ${ORDER_STATUS_LABELS[o.status] || o.status}`,
          href: `/grower/orders/${o.id}`,
        });
      });

      // Search Customers (Dispensaries that have ordered)

      customers.forEach((c) => {
        results.push({
          id: c.id,
          type: 'customer',
          title: c.businessName,
          subtitle: [c.city, c.state].filter(Boolean).join(', ') || 'Customer',
          href: `/grower/customers/${c.id}`,
        });
      });

      // Search Strains

      strains.forEach((s) => {
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
              {
                grower: {
                  businessName: { contains: query, mode: 'insensitive' },
                },
              },
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
              {
                grower: {
                  businessName: { contains: query, mode: 'insensitive' },
                },
              },
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

      products.forEach((p) => {
        results.push({
          id: p.id,
          type: 'product',
          title: p.name,
          subtitle: `${p.productType || 'Product'} • ${p.isPriceVisible ? formatMoney(p.price) : 'Price on request'} • ${p.grower.businessName}`,
          href: `/dispensary/catalog?search=${encodeURIComponent(p.name)}&product=${encodeURIComponent(p.id)}`,
        });
      });

      // Search Orders

      orders.forEach((o) => {
        results.push({
          id: o.id,
          type: 'order',
          title: `Order #${o.orderId}`,
          subtitle: `${o.grower.businessName} • ${formatMoney(o.totalAmount)} • ${ORDER_STATUS_LABELS[o.status] || o.status}`,
          href: `/dispensary/orders/${o.id}`,
        });
      });
    }

    if (user.role === 'ADMIN') {
      const accounts = await db.user.findMany({
        where: {
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
            {
              grower: {
                OR: [
                  { businessName: { contains: query, mode: 'insensitive' } },
                  { licenseNumber: { contains: query, mode: 'insensitive' } },
                ],
              },
            },
            {
              dispensary: {
                OR: [
                  { businessName: { contains: query, mode: 'insensitive' } },
                  { licenseNumber: { contains: query, mode: 'insensitive' } },
                ],
              },
            },
          ],
        },
        select: {
          id: true,
          email: true,
          name: true,
          grower: { select: { id: true, businessName: true } },
          dispensary: { select: { id: true, businessName: true } },
        },
        take: 15,
      });
      for (const account of accounts)
        results.push({
          id: account.id,
          type: 'customer',
          title:
            account.grower?.businessName ||
            account.dispensary?.businessName ||
            account.name ||
            account.email,
          subtitle: account.email,
          href: account.grower
            ? `/admin/review/grower/${account.grower.id}`
            : account.dispensary
              ? `/admin/review/dispensary/${account.dispensary.id}`
              : `/admin/users?q=${encodeURIComponent(account.email)}`,
        });
    }
    if (user.role === 'DISPENSARY') {
      const growers = await db.grower.findMany({
        where: {
          ...marketplaceGrowerWhere(),
          businessName: { contains: query, mode: 'insensitive' },
        },
        select: { id: true, businessName: true, city: true, state: true },
        take: 5,
      });
      for (const grower of growers)
        results.push({
          id: grower.id,
          type: 'grower',
          title: grower.businessName,
          subtitle: [grower.city, grower.state].filter(Boolean).join(', '),
          href: `/dispensary/grower/${grower.id}`,
        });
    }
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'We could not search right now. Please try again.' },
      { status: 500 }
    );
  }
}
