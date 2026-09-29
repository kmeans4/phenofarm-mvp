import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { getBuyerCatalog } from '@/lib/buyer-catalog';
export async function GET(request: NextRequest) {
  const session = await getAuthSession();
  if (session?.user.role !== 'DISPENSARY' || !session.user.dispensaryId)
    return NextResponse.json(
      { error: 'Please sign in as a dispensary.' },
      { status: 401 }
    );
  const query =
    request.nextUrl.searchParams.get('q')?.trim().slice(0, 160) || '';
  if (query.length < 2) return NextResponse.json({ suggestions: [], query });
  try {
    const data = await getBuyerCatalog(
      session.user.dispensaryId,
      new URLSearchParams({ search: query, limit: '6', inStock: 'true' })
    );
    const products = data.products.map((product) => ({
      text: product.name,
      type: 'product',
      id: product.id,
    }));
    const growers = [
      ...new Map(
        data.products.map((product) => [
          product.grower.id,
          {
            text: product.grower.businessName,
            type: 'grower',
            id: product.grower.id,
          },
        ])
      ).values(),
    ].filter((grower) =>
      query
        .toLowerCase()
        .split(/\s+/)
        .some((word) => grower.text.toLowerCase().includes(word))
    );
    return NextResponse.json({
      suggestions: [...products, ...growers].slice(0, 8),
      query,
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to load suggestions.' },
      { status: 500 }
    );
  }
}
