import { getBuyerCatalog } from '@/lib/buyer-catalog';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { apiError, logApiError } from '@/lib/api-response';

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

    return NextResponse.json(await getBuyerCatalog(user.dispensaryId, new URL(request.url).searchParams));
  } catch (error) {
    logApiError('dispensary.catalog.GET', error, { route: '/api/dispensary/catalog' });
    return apiError(500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
  }
}
