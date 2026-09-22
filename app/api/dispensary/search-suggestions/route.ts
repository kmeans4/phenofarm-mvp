import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import { getAllProductTypes } from '@/lib/product-types';
import { buyerProductWhere, parsePage } from '@/lib/buyer-products';
import { marketplaceGrowerWhere } from '@/lib/license';

export async function GET(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'DISPENSARY' || !session.user.dispensaryId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const query = request.nextUrl.searchParams.get('q')?.trim().slice(0, 160) || '';
  const limit = parsePage(request.nextUrl.searchParams.get('limit'), 8, 10);
  if (query.length < 2) return NextResponse.json({ suggestions: [], query });
  try {
    const pattern = { contains: query, mode: 'insensitive' as const };
    const available = { ...buyerProductWhere(), isAvailable: true, inventoryQty: { gt: 0 } };
    const [products, strains, growers] = await Promise.all([
      db.product.findMany({ where: { ...available, name: pattern }, select: { id: true, name: true }, take: limit }),
      db.strain.findMany({ where: { OR: [{ name: pattern }, { genetics: pattern }], products: { some: available } }, select: { id: true, name: true }, take: limit }),
      db.grower.findMany({ where: { ...marketplaceGrowerWhere(), businessName: pattern, products: { some: { isDeleted: false, status: 'PUBLISHED', isAvailable: true, inventoryQty: { gt: 0 } } } }, select: { id: true, businessName: true }, take: limit }),
    ]);
    const candidates = [...products.map(product => ({ text: product.name, type: 'product', id: product.id })), ...strains.map(strain => ({ text: strain.name, type: 'strain', id: strain.id })), ...growers.map(grower => ({ text: grower.businessName, type: 'grower', id: grower.id })), ...getAllProductTypes().filter(type => type.toLowerCase().includes(query.toLowerCase())).map(text => ({ text, type: 'category' }))];
    const unique = [...new Map(candidates.map(candidate => [candidate.text.toLowerCase(), candidate])).values()];
    return NextResponse.json({ suggestions: unique.slice(0, limit), query });
  } catch { return NextResponse.json({ error: 'Unable to load suggestions.' }, { status: 500 }); }
}
