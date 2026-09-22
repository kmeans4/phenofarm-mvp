import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import { expandProductTypeFilters } from '@/lib/product-types';
import { Prisma } from '@prisma/client';
import { apiError, logApiError } from '@/lib/api-response';
import { marketplaceGrowerWhere } from '@/lib/license';
import { buyerProductSelect, serializeBuyerProducts, parsePage, normalizeProductIds } from '@/lib/buyer-products';

/**
 * Dispensary Catalog API
 *
 * GET /api/dispensary/catalog?page=1&limit=20
 *
 * Query Parameters:
 * - page (optional): Page number, defaults to 1
 * - limit (optional): Products per page, defaults to 20, max 100
 * - cursor (optional): Product id from nextCursor
 * - search (optional): Search products by name, strain, or type
 * - productTypes (optional): Comma-separated list of product types
 * - thcRanges (optional): Comma-separated list of THC range IDs (low, medium, high, very-high)
 * - priceRanges (optional): Comma-separated list of unit-price range IDs (budget, standard, premium, luxury)
 * - sortBy (optional): Sort option (default, price-asc, price-desc, thc-asc, thc-desc, name-asc, name-desc)
 * - recentlyAdded (optional): Show only products added in last 7 days (true/false)
 * - trending (optional): Show trending products sorted by order volume (true/false)
 *
 * Response: 200 OK - { products: [], hasMore: boolean, total: number }
 */

const THC_RANGES = {
  low: { min: 0, max: 15 },
  medium: { min: 15, max: 20 },
  high: { min: 20, max: 25 },
  'very-high': { min: 25, max: 100 },
};

const PRICE_RANGES = {
  budget: { min: 0, max: 10 },
  standard: { min: 10, max: 25 },
  premium: { min: 25, max: 50 },
  luxury: { min: 50, max: 10000 },
};

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return apiError(401, 'UNAUTHORIZED', 'Unauthorized');
    }

    const user = session.user;

    if (user.role !== 'DISPENSARY' || !user.dispensaryId) {
      return apiError(403, 'FORBIDDEN', 'Forbidden - Dispensary access only');
    }

    const { searchParams } = new URL(request.url);

    // Pagination params
    const page = parsePage(searchParams.get('page'));
    const limit = parsePage(searchParams.get('limit'), 20, 100);
    const cursor = searchParams.get('cursor');
    const skip = (page - 1) * limit;

    // Filter params
    const search = searchParams.get('search')?.trim().slice(0, 160);
    const productTypes = searchParams.get('productTypes')?.split(',').filter(Boolean);
    const thcRanges = searchParams.get('thcRanges')?.split(',').filter(Boolean);
    const priceRanges = searchParams.get('priceRanges')?.split(',').filter(Boolean);
    const sortBy = searchParams.get('sortBy') || 'default';
    const recentlyAdded = searchParams.get('recentlyAdded') === 'true';
    const trending = searchParams.get('trending') === 'true';

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      isAvailable: true,
      isDeleted: false,
      status: 'PUBLISHED',
      inventoryQty: { gt: 0 },
      grower: marketplaceGrowerWhere(),
    };
    const andClauses: Prisma.ProductWhereInput[] = [];
    if (searchParams.get('favorites') === 'true') {
      if (searchParams.has('favoriteIds')) where.id = { in: normalizeProductIds(searchParams.get('favoriteIds')?.split(',')) };
      else where.favoriteProducts = { some: { dispensaryId: user.dispensaryId } };
    }

    // Recently Added filter (last 7 days)
    if (recentlyAdded) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      where.createdAt = { gte: sevenDaysAgo };
    }

    // Trending filter - products with order volume in last 30 days
    if (trending) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      where.orderItems = { some: { createdAt: { gte: thirtyDaysAgo }, order: { status: { not: 'CANCELLED' } } } };
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { grower: { businessName: { contains: search, mode: 'insensitive' } } },
        { productType: { contains: search, mode: 'insensitive' } },
        {
          strain: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    // Product type filter
    if (productTypes && productTypes.length > 0) {
      where.productType = { in: expandProductTypeFilters(productTypes) };
    }

    // Build THC range filter
    if (thcRanges && thcRanges.length > 0) {
      const thcConditions = thcRanges
        .map((rangeId) => {
          const range = THC_RANGES[rangeId as keyof typeof THC_RANGES];
          if (!range) return null;
          return {
            OR: [
              {
                batch: {
                  thc: { gte: range.min, lt: range.max },
                },
              },
              { thcMax: { gte: range.min, lt: range.max } },
              { thcMin: { gte: range.min, lt: range.max } },
            ],
          };
        })
        .filter(Boolean);

      if (thcConditions.length > 0) {
        andClauses.push({ OR: thcConditions as Prisma.ProductWhereInput[] });
      }
    }

    // Build price range filter
    if (priceRanges && priceRanges.length > 0) {
      const priceConditions = priceRanges
        .map((rangeId) => {
          const range = PRICE_RANGES[rangeId as keyof typeof PRICE_RANGES];
          if (!range) return null;
          return {
            isPriceVisible: true, price: { gte: range.min, lt: range.max },
          };
        })
        .filter(Boolean);

      if (priceConditions.length > 0) {
        andClauses.push({ OR: priceConditions as Prisma.ProductWhereInput[] });
      }
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    // Determine order by
    let orderBy: Prisma.ProductOrderByWithRelationInput[] = [];
    let trendingSort = false;

    if (trending) {
      trendingSort = true;
      orderBy = [{ id: 'asc' }]; // placeholder, will sort manually
    } else {
      switch (sortBy) {
        case 'price-asc':
          orderBy = [{ price: 'asc' }, { id: 'asc' }];
          break;
        case 'price-desc':
          orderBy = [{ price: 'desc' }, { id: 'desc' }];
          break;
        case 'thc-asc':
          orderBy = [{ batch: { thc: 'asc' } }, { id: 'asc' }];
          break;
        case 'thc-desc':
          orderBy = [{ batch: { thc: 'desc' } }, { id: 'desc' }];
          break;
        case 'name-asc':
          orderBy = [{ name: 'asc' }, { id: 'asc' }];
          break;
        case 'name-desc':
          orderBy = [{ name: 'desc' }, { id: 'desc' }];
          break;
        default:
          orderBy = [{ grower: { businessName: 'asc' } }, { name: 'asc' }, { id: 'asc' }];
      }
    }

    const productTypeFacetWhere: Prisma.ProductWhereInput = { ...where };
    delete productTypeFacetWhere.productType;

    const [total, productTypeRows, trendingRows, regularProducts] = await Promise.all([
      db.product.count({ where }),
      db.product.groupBy({
        by: ['productType'],
        where: productTypeFacetWhere,
        _count: { _all: true },
      }),
      trendingSort ? db.orderItem.groupBy({
        by: ['productId'],
        where: { product: where, createdAt: { gte: new Date(Date.now() - 30 * 86400000) }, order: { status: { not: 'CANCELLED' } } },
        _sum: { quantity: true }, orderBy: [{ _sum: { quantity: 'desc' } }, { productId: 'asc' }],
        skip, take: limit + 1,
      }) : Promise.resolve(null),
      !trendingSort ? db.product.findMany({ where, select: buyerProductSelect, orderBy, skip: cursor ? 1 : skip, take: limit + 1, ...(cursor ? { cursor: { id: cursor } } : {}) }) : Promise.resolve(null),
    ]);
    const products = regularProducts ?? await db.product.findMany({
      where: trendingRows ? { ...where, id: { in: trendingRows.map(row => row.productId) } } : where,
      select: buyerProductSelect, orderBy,
      ...(!trendingRows ? { skip: cursor ? 1 : skip, take: limit + 1, ...(cursor ? { cursor: { id: cursor } } : {}) } : {}),
    });
    if (trendingRows) {
      const rank = new Map(trendingRows.map((row, index) => [row.productId, index]));
      products.sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
    }

    const productTypeCounts = productTypeRows.reduce<Record<string, number>>((acc, product) => {
      const type = product.productType?.trim();
      if (type) {
        acc[type] = product._count._all;
      }
      return acc;
    }, {});

    const hasMore = products.length > limit;
    const serializedProducts = await serializeBuyerProducts(products.slice(0, limit));

    return NextResponse.json(
      {
        products: serializedProducts,
        hasMore,
        total,
        page,
        limit,
        recentlyAdded,
        trending,
        productTypeCounts,
        nextCursor: hasMore ? serializedProducts[serializedProducts.length - 1]?.id || null : null,
      },
      { status: 200 }
    );
  } catch (error) {
    logApiError('dispensary.catalog.GET', error, { route: '/api/dispensary/catalog' });
    return apiError(500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
  }
}
