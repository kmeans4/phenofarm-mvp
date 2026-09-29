import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import {
  buyerProductSelect,
  buyerProductWhere,
  serializeBuyerProducts,
} from '@/lib/buyer-products';
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (session?.user.role !== 'DISPENSARY' || !session.user.dispensaryId)
    return NextResponse.json(
      { error: 'Please sign in as a dispensary.' },
      { status: 401 }
    );
  const { id } = await params;
  const row = await db.product.findFirst({
    where: { id, ...buyerProductWhere() },
    select: { ...buyerProductSelect, description: true, images: true },
  });
  if (!row)
    return NextResponse.json(
      { error: 'This product is no longer listed.' },
      { status: 404 }
    );
  const grower = await db.grower.findUnique({
    where: { id: row.growerId },
    select: {
      commercialMinimumOrder: true,
      commercialFulfillmentMethods: true,
      commercialFulfillmentRegion: true,
      commercialPaymentTerms: true,
    },
  });
  const [product] = await serializeBuyerProducts([row]);
  const photos = row.images
    .filter(
      (url) => url.length <= 2048 && /^(https?:\/\/|\/uploads\/)/.test(url)
    )
    .slice(0, 8);
  return NextResponse.json({
    product: {
      ...product,
      images: photos.length ? photos : product.images,
      description: row.description,
      terms: grower,
    },
  });
}
