import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { AuthSession } from "@/types";

const PRODUCTS_PER_PAGE = 12;

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = (session as AuthSession).user;
  if (user.role !== "DISPENSARY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || String(PRODUCTS_PER_PAGE));
  const sortBy = searchParams.get("sortBy") || "default";
  const searchQuery = searchParams.get("search") || "";
  const productTypes = searchParams.get("productTypes")?.split(",").filter(Boolean) || [];
  const thcRanges = searchParams.get("thcRanges")?.split(",").filter(Boolean) || [];
  const priceRanges = searchParams.get("priceRanges")?.split(",").filter(Boolean) || [];

  // Build where clause
  const where: any = {
    isAvailable: true,
    inventoryQty: { gt: 0 },
  };

  if (productTypes.length > 0) {
    where.productType = { in: productTypes };
  }

  if (thcRanges.length > 0) {
    const thcConditions: unknown[] = [];
    for (const range of thcRanges) {
      switch (range) {
        case "low":
          thcConditions.push({ batch: { thc: { gte: 0, lt: 15 } } });
          break;
        case "medium":
          thcConditions.push({ batch: { thc: { gte: 15, lt: 20 } } });
          break;
        case "high":
          thcConditions.push({ batch: { thc: { gte: 20, lt: 25 } } });
          break;
        case "very-high":
          thcConditions.push({ batch: { thc: { gte: 25 } } });
          break;
      }
    }
    if (thcConditions.length > 0) {
      where.OR = thcConditions;
    }
  }

  if (priceRanges.length > 0) {
    const priceConditions: unknown[] = [];
    for (const range of priceRanges) {
      switch (range) {
        case "budget":
          priceConditions.push({ price: { gte: 0, lt: 5 } });
          break;
        case "standard":
          priceConditions.push({ price: { gte: 5, lt: 10 } });
          break;
        case "premium":
          priceConditions.push({ price: { gte: 10, lt: 25 } });
          break;
        case "luxury":
          priceConditions.push({ price: { gte: 25 } });
          break;
      }
    }
    if (priceConditions.length > 0) {
      where.OR = priceConditions;
    }
  }

  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery, mode: "insensitive" } },
      { strain: { name: { contains: searchQuery, mode: "insensitive" } } },
      { strainLegacy: { contains: searchQuery, mode: "insensitive" } },
      { productType: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  // Build orderBy
  let orderBy: any = [];
  switch (sortBy) {
    case "price-asc":
      orderBy = [{ price: "asc" }];
      break;
    case "price-desc":
      orderBy = [{ price: "desc" }];
      break;
    case "thc-asc":
      orderBy = [{ batch: { thc: "asc" } }];
      break;
    case "thc-desc":
      orderBy = [{ batch: { thc: "desc" } }];
      break;
    case "name-asc":
      orderBy = [{ name: "asc" }];
      break;
    case "name-desc":
      orderBy = [{ name: "desc" }];
      break;
    default:
      orderBy = [{ grower: { businessName: "asc" } }, { name: "asc" }];
  }

  const skip = (page - 1) * limit;

  const [products, totalCount] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        grower: {
          select: {
            id: true,
            businessName: true,
          },
        },
        strain: {
          select: {
            id: true,
            name: true,
          },
        },
        batch: {
          select: {
            thc: true,
            cbd: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    db.product.count({ where }),
  ]);

  // Transform products to match frontend format
  const transformedProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    price: Number(product.price),
    strain: product.strain?.name || product.strainLegacy,
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

  // Group by grower if default sort
  let groupedData: any = transformedProducts;
  if (sortBy === "default") {
    const groups: Record<string, any> = {};
    for (const product of transformedProducts) {
      const growerId = product.grower.id;
      if (!groups[growerId]) {
        groups[growerId] = {
          growerId: growerId,
          growerName: product.grower.businessName,
          products: [],
        };
      }
      groups[growerId].products.push(product);
    }
    groupedData = Object.values(groups);
  }

  const totalPages = Math.ceil(totalCount / limit);
  const hasMore = page < totalPages;

  return NextResponse.json({
    products: sortBy === "default" ? [] : transformedProducts,
    groups: sortBy === "default" ? groupedData : [],
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasMore,
    },
  });
}
