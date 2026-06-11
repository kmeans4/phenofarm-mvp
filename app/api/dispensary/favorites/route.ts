import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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

function normalizeProductIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((id) => String(id || "").trim()).filter(Boolean))).slice(0, 200);
}

function isMissingFavoritesTableError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
    return String(error.meta?.table ?? error.message).includes("dispensary_favorite_products");
  }

  const message = error instanceof Error ? error.message : String(error);
  return message.includes("dispensary_favorite_products") && message.toLowerCase().includes("does not exist");
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
    if (isMissingFavoritesTableError(error)) {
      console.warn("Favorite products table is not available; falling back to browser-saved favorites.");
      return NextResponse.json({ productIds: [] });
    }

    console.error("Error loading favorite products:", error);
    return NextResponse.json({ error: "Failed to load favorite products" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const productIds = normalizeProductIds(body.productIds);

  try {
    const auth = await requireDispensary();
    if ("error" in auth) return auth.error;
    const dispensaryId = auth.user.dispensaryId;
    if (!dispensaryId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existingProducts = await db.product.findMany({
      where: {
        id: { in: productIds },
        isDeleted: false,
      },
      select: { id: true },
    });
    const existingProductIds = existingProducts.map((product) => product.id);

    await db.$transaction([
      db.dispensaryFavoriteProduct.deleteMany({
        where: { dispensaryId },
      }),
      ...existingProductIds.map((productId) =>
        db.dispensaryFavoriteProduct.create({
          data: {
            dispensaryId,
            productId,
          },
        })
      ),
    ]);

    return NextResponse.json({ productIds: existingProductIds });
  } catch (error) {
    if (isMissingFavoritesTableError(error)) {
      console.warn("Favorite products table is not available; keeping favorites browser-local.");
      return NextResponse.json({ productIds });
    }

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
        isAvailable: true,
        isDeleted: false,
        inventoryQty: { gt: 0 },
      },
      include: {
        grower: {
          select: {
            id: true,
            businessName: true,
            city: true,
            state: true,
            isVerified: true,
          },
        },
        strain: {
          select: {
            id: true,
            name: true,
            genetics: true,
          },
        },
        batch: {
          select: {
            thc: true,
            cbd: true,
          },
        },
      },
    });

    // Transform to match the Product interface
    const formattedProducts = products.map(product => {
      const strainName = product.strain?.name || product.strainLegacy || '';
      const genetics = product.strain?.genetics || '';
      // Infer strain type from strain name or genetics
      const strainType = genetics.toLowerCase().includes('indica') ? 'Indica' :
                        genetics.toLowerCase().includes('sativa') ? 'Sativa' :
                        genetics.toLowerCase().includes('hybrid') ? 'Hybrid' :
                        strainName.toLowerCase().includes('indica') ? 'Indica' :
                        strainName.toLowerCase().includes('sativa') ? 'Sativa' :
                        strainName.toLowerCase().includes('hybrid') ? 'Hybrid' : null;
      
      return {
        id: product.id,
        name: product.name,
        price: parseFloat(String(product.price)),
        isPriceVisible: product.isPriceVisible,
        strain: strainName || null,
        strainId: product.strainId,
        strainType,
        productType: product.productType,
        subType: product.subType,
        unit: product.unit,
        thc: product.batch?.thc ?? product.thcLegacy ?? null,
        cbd: product.batch?.cbd ?? product.cbdLegacy ?? null,
        images: product.images || [],
        inventoryQty: product.inventoryQty,
        grower: {
          id: product.grower.id,
          businessName: product.grower.businessName,
          location: product.grower.city && product.grower.state 
            ? `${product.grower.city}, ${product.grower.state}`
            : product.grower.city || product.grower.state || null,
          isVerified: product.grower.isVerified,
        },
      };
    });

    return NextResponse.json({ products: formattedProducts });
  } catch (error) {
    console.error("Error fetching favorite products:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorite products" },
      { status: 500 }
    );
  }
}
