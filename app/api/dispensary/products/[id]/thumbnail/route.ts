import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { buyerProductWhere } from '@/lib/buyer-products';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session) return new NextResponse(null, { status: 401 });
  if (session.user.role !== 'DISPENSARY' || !session.user.dispensaryId) return new NextResponse(null, { status: 403 });
  const { id } = await params;
  const product = await db.product.findFirst({ where: { id, ...buyerProductWhere() }, select: { images: true } });
  const source = product?.images[0];
  if (!product) return new NextResponse(null, { status: 404 });
  if (!source || ['/products/edibles.jpg', '/products/silver-haze.jpg', '/products/purple-haze.jpg'].includes(source)) return new NextResponse('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120"><rect width="160" height="120" fill="#e7eadf"/><path d="M54 76c-5-26 15-39 53-40-1 35-16 50-41 43m-6 9 27-32" fill="none" stroke="#386348" stroke-width="4" stroke-linecap="round"/></svg>', { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'private, max-age=300' } });
  if (/^\/uploads\/[A-Za-z0-9_./-]+$/.test(source) && !source.includes('..')) return NextResponse.redirect(new URL(source, request.url));
  const data = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/.exec(source);
  if (data) return new NextResponse(Buffer.from(data[2], 'base64'), { headers: { 'Content-Type': data[1], 'Cache-Control': 'private, max-age=300', 'X-Content-Type-Options': 'nosniff' } });
  try {
    const url = new URL(source);
    if (url.protocol === 'https:' || url.protocol === 'http:') return NextResponse.redirect(url);
  } catch { /* Invalid stored URL. */ }
  return new NextResponse(null, { status: 404 });
}
