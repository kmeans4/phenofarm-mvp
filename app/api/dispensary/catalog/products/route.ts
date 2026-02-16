import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

const PAGE_SIZE = 12;

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = (session as any).user as { role: string };
  
  if (user.role !== "DISPENSARY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const growerId = searchParams.get("growerId");
  
  try {
    const where: any = {
      isAvailable: true,
      inventoryQty: { gt: 0 },
    };
    
    if (growerId) {
      where.growerId = growerId;
    }
    
    const cursorCondition = cursor ? { id: { gt: cursor } } : {};
    
    const products = await db.product.findMany({
      where: { ...where, ...cursorCondition },
      include: {
        grower: { select: { id: true, businessName: true } },
        strain: { select: { id: true, name: true } },
        batch: { select: { thc: true, cbd: true } },
      },
      orderBy: [
        { grower: { businessName: "asc" } },
        { name: "asc" },
      ],
      take: PAGE_SIZE + 1,
    });

    const hasMore = products.length > PAGE_SIZE;
    const slicedProducts = hasMore ? products.slice(0, PAGE_SIZE) : products;
    
    const formattedProducts = slicedProducts.map((product) => ({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      strain: product.strain?.name || null,
      strainId: product.strainId,
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
      },
    }));

    const groups = formattedProducts.reduce((acc: any[], product) => {
      const existingGroup = acc.find(g => g.growerId === product.grower.id);
      if (existingGroup) {
        existingGroup.products.push(product);
      } else {
        acc.push({
          growerId: product.grower.id,
          growerName: product.grower.businessName,
          products: [product],
        });
      }
      return acc;
    }, []);

    return NextResponse.json({
      groups,
      nextCursor: hasMore ? slicedProducts[slicedProducts.length - 1]?.id : null,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
