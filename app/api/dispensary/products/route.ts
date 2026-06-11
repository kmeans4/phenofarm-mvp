import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { db } from "@/lib/db";
import { AuthSession } from "@/types";
import { expandProductTypeFilters } from "@/lib/product-types";
import {
  toSafeAvailability,
  toSafeBoolean,
  toSafeNonNegativeInteger,
  toSafeNonNegativeNumber,
  toSafeOptionalNumber,
  toSafeOptionalString,
  toSafeProductName,
  toSafeProductType,
  toSafeStringArray,
  toSafeUnit,
} from "@/lib/product-serializers";
import { Prisma } from "@prisma/client";

const PRODUCTS_PER_PAGE = 12;

type DispensaryProduct = {
  id: string;
  name: string;
  price: number;
  isPriceVisible: boolean;
  strain: string | null;
  strainId: string | null;
  productType: string | null;
  subType: string | null;
  unit: string;
  thc: number | null;
  cbd: number | null;
  images: string[];
  inventoryQty: number;
  isAvailable: boolean;
  grower: {
    id: string;
    businessName: string;
  };
};

type GrowerGroup = {
  growerId: string;
  growerName: string;
  products: DispensaryProduct[];
};

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
  const where: Prisma.ProductWhereInput = {
    isAvailable: true,
    inventoryQty: { gt: 0 },
  };

  if (productTypes.length > 0) {
    where.productType = { in: expandProductTypeFilters(productTypes) };
  }

  if (thcRanges.length > 0) {
    const thcConditions: Prisma.ProductWhereInput[] = [];
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
    const priceConditions: Prisma.ProductWhereInput[] = [];
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
  let orderBy: Prisma.ProductOrderByWithRelationInput[] = [];
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
  const transformedProducts: DispensaryProduct[] = products.map((product) => {
    const inventoryQty = toSafeNonNegativeInteger(product.inventoryQty, 0);

    return {
      id: product.id,
      name: toSafeProductName(product.name),
      price: toSafeNonNegativeNumber(product.price, 0),
      isPriceVisible: toSafeBoolean(product.isPriceVisible, true),
      strain: toSafeOptionalString(product.strain?.name || product.strainLegacy),
      strainId: product.strainId,
      productType: toSafeProductType(product.productType, product.categoryLegacy),
      subType: toSafeOptionalString(product.subType),
      unit: toSafeUnit(product.unit),
      thc: toSafeOptionalNumber(product.batch?.thc ?? product.thcLegacy),
      cbd: toSafeOptionalNumber(product.batch?.cbd ?? product.cbdLegacy),
      images: toSafeStringArray(product.images),
      inventoryQty,
      isAvailable: toSafeAvailability(product.isAvailable, inventoryQty),
      grower: {
        id: product.grower.id,
        businessName: toSafeOptionalString(product.grower.businessName) || 'Unknown Grower',
      },
    };
  });

  // Group by grower if default sort
  let groupedData: GrowerGroup[] | DispensaryProduct[] = transformedProducts;
  if (sortBy === "default") {
    const groups: Record<string, GrowerGroup> = {};
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
