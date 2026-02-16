import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';

/**
 * Dispensary Catalog API
 * 
 * GET /api/dispensary/catalog?page=1&limit=20
 * 
 * Query Parameters:
 * - page (optional): Page number, defaults to 1
 * - limit (optional): Products per page, defaults to 20, max 50
 * - search (optional): Search products by name, strain, or type
 * - productTypes (optional): Comma-separated list of product types
 * - thcRanges (optional): Comma-separated list of THC range IDs (low, medium, high, very-high)
 * - priceRanges (optional): Comma-separated list of price range IDs (budget, standard, premium, luxury)
 * - sortBy (optional): Sort option (default, price-asc, price-desc, thc-asc, thc-desc, name-asc, name-desc)
 * - recentlyAdded (optional): Show only products added in last 7 days (true/false)
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
  budget: { min: 0, max: 5 },
  standard: { min: 5, max: 10 },
  premium: { min: 10, max: 25 },
  luxury: { min: 25, max: 10000 },
};

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;
    
    if (user.role !== 'DISPENSARY') {
      return NextResponse.json({ error: 'Forbidden - Dispensary access only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    
    // Pagination params
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;
    
    // Filter params
    const search = searchParams.get('search');
    const productTypes = searchParams.get('productTypes')?.split(',').filter(Boolean);
    const thcRanges = searchParams.get('thcRanges')?.split(',').filter(Boolean);
    const priceRanges = searchParams.get('priceRanges')?.split(',').filter(Boolean);
    const sortBy = searchParams.get('sortBy') || 'default';
    const recentlyAdded = searchParams.get('recentlyAdded') === 'true';

    // Build where clause
    const where: any = {
      isAvailable: true,
      inventoryQty: { gt: 0 },
    };

    // Recently Added filter (last 7 days)
    if (recentlyAdded) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      where.createdAt = { gte: sevenDaysAgo };
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { strainLegacy: { contains: search, mode: 'insensitive' } },
        { productType: { contains: search, mode: 'insensitive' } },
        { 
          strain: { 
            name: { contains: search, mode: 'insensitive' } 
          } 
        },
      ];
    }

    // Product type filter
    if (productTypes && productTypes.length > 0) {
      where.productType = { in: productTypes };
    }

    // Build THC range filter
    if (thcRanges && thcRanges.length > 0) {
      const thcConditions = thcRanges.map(rangeId => {
        const range = THC_RANGES[rangeId as keyof typeof THC_RANGES];
        if (!range) return null;
        return {
          OR: [
            { 
              batch: { 
                thc: { gte: range.min, lt: range.max } 
              } 
            },
            { 
              thcLegacy: { gte: range.min, lt: range.max } 
            },
          ],
        };
      }).filter(Boolean);

      if (thcConditions.length > 0) {
        where.AND = where.AND || [];
        where.AND.push({ OR: thcConditions });
      }
    }

    // Build price range filter
    if (priceRanges && priceRanges.length > 0) {
      const priceConditions = priceRanges.map(rangeId => {
        const range = PRICE_RANGES[rangeId as keyof typeof PRICE_RANGES];
        if (!range) return null;
        return {
          price: { gte: range.min, lt: range.max },
        };
      }).filter(Boolean);

      if (priceConditions.length > 0) {
        where.AND = where.AND || [];
        where.AND.push({ OR: priceConditions });
      }
    }

    // Determine order by
    let orderBy: any = {};
    switch (sortBy) {
      case 'price-asc':
        orderBy = { price: 'asc' };
        break;
      case 'price-desc':
        orderBy = { price: 'desc' };
        break;
      case 'thc-asc':
        orderBy = { batch: { thc: 'asc' } };
        break;
      case 'thc-desc':
        orderBy = { batch: { thc: 'desc' } };
        break;
      case 'name-asc':
        orderBy = { name: 'asc' };
        break;
      case 'name-desc':
        orderBy = { name: 'desc' };
        break;
      default:
        orderBy = [
          { grower: { businessName: 'asc' } },
          { name: 'asc' },
        ];
    }

    // Get total count for pagination info
    const total = await db.product.count({ where });

    // Fetch products
    const products = await db.product.findMany({
      where,
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
      orderBy,
      skip,
      take: limit,
    });

    // Serialize products
    const serializedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: parseFloat(String(p.price)),
      strain: p.strain?.name || p.strainLegacy || null,
      strainId: p.strainId,
      strainType: p.strain?.genetics || null,
      productType: p.productType,
      subType: p.subType,
      unit: p.unit,
      thc: p.batch?.thc ?? p.thcLegacy ?? null,
      cbd: p.batch?.cbd ?? p.cbdLegacy ?? null,
      images: p.images || [],
      inventoryQty: p.inventoryQty,
      createdAt: p.createdAt,
      grower: {
        id: p.grower.id,
        businessName: p.grower.businessName,
        location: p.grower.city && p.grower.state ? `${p.grower.city}, ${p.grower.state}` : p.grower.city || p.grower.state || null,
        isVerified: p.grower.isVerified,
      },
    }));

    const hasMore = skip + products.length < total;

    return NextResponse.json({
      products: serializedProducts,
      hasMore,
      total,
      page,
      limit,
      recentlyAdded,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching dispensary catalog:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
