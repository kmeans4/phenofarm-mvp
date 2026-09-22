import { NextRequest, NextResponse } from "next/server";
import { buyerProductSelect, serializeBuyerProduct, normalizeProductIds, buyerProductWhere } from "@/lib/buyer-products";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helpers";

async function requireDispensary() {
  const session = await getAuthSession();

  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const user = session.user;
  if (user.role !== "DISPENSARY" || !user.dispensaryId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user };
}

export async function GET() {
  try {
    const auth = await requireDispensary();
    if ("error" in auth) return auth.error;
    const dispensaryId = auth.user.dispensaryId;
    if (!dispensaryId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const favorites = await db.dispensaryFavoriteProduct.findMany({
      where: { dispensaryId },
      orderBy: { createdAt: "desc" },
      select: { productId: true },
    });

    return NextResponse.json({ productIds: favorites.map((favorite) => favorite.productId) });
  } catch (error) {
    console.error("Error loading favorite products:", error);
    return NextResponse.json({ error: "Failed to load favorite products" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireDispensary();
    if ("error" in auth) return auth.error;
    const dispensaryId = auth.user.dispensaryId;
    if (!dispensaryId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.productIds)) return NextResponse.json({ error: 'Provide productIds.' }, { status: 400 });
    const productIds = normalizeProductIds(body.productIds);

    const existingProducts = await db.product.findMany({
      where: {
        id: { in: productIds },
        ...buyerProductWhere(),
      },
      select: { id: true },
    });
    const existingProductIds = existingProducts.map((product) => product.id);

    await db.$transaction([
      db.dispensaryFavoriteProduct.deleteMany({
        where: { dispensaryId, productId: { notIn: existingProductIds } },
      }),
      db.dispensaryFavoriteProduct.createMany({ data: existingProductIds.map(productId => ({ dispensaryId, productId })), skipDuplicates: true }),
    ]);

    return NextResponse.json({ productIds: existingProductIds });
  } catch (error) {
    console.error("Error saving favorite products:", error);
    return NextResponse.json({ error: "Failed to save favorite products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireDispensary();
    if ("error" in auth) return auth.error;

    const body = await req.json();
    const productIds = normalizeProductIds(body.productIds);

    if (productIds.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Fetch full product details for the given IDs
    const products = await db.product.findMany({
      where: {
        id: { in: productIds },
        ...buyerProductWhere(),
      },
      select: buyerProductSelect,
    });
    const formattedProducts = products.map(serializeBuyerProduct);

    return NextResponse.json({ products: formattedProducts });
  } catch (error) {
    console.error("Error fetching favorite products:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorite products" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireDispensary();
  if ('error' in auth) return auth.error;
  const dispensaryId = auth.user.dispensaryId!;
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.added) || !Array.isArray(body.removed)) return NextResponse.json({ error: 'Provide added and removed IDs.' }, { status: 400 });
  const added = normalizeProductIds(body.added);
  const removed = normalizeProductIds(body.removed);
  const products = await db.product.findMany({ where: { id: { in: added }, ...buyerProductWhere() }, select: { id: true } });
  await db.$transaction([
    db.dispensaryFavoriteProduct.deleteMany({ where: { dispensaryId, productId: { in: removed } } }),
    db.dispensaryFavoriteProduct.createMany({ data: products.map(product => ({ dispensaryId, productId: product.id })), skipDuplicates: true }),
  ]);
  return NextResponse.json({ ok: true });
}
