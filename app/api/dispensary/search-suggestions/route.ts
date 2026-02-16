import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';

/**
 * Search Suggestions API
 * 
 * GET /api/dispensary/search-suggestions?q=search-term
 * 
 * Returns autocomplete suggestions for:
 * - Product names
 * - Strain names  
 * - Grower business names
 * - Product types
 * - Popular/recent searches (stored per user)
 * 
 * Response: 200 OK - { suggestions: [], recentSearches: [], popular: [] }
 */

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
    const query = searchParams.get('q') || '';
    const limit = Math.min(10, Math.max(1, parseInt(searchParams.get('limit') || '8')));

    const suggestions: { text: string; type: string; id?: string }[] = [];

    if (query.length >= 2) {
      const searchPattern = { contains: query, mode: 'insensitive' as const };

      // Search products by name
      const products = await db.product.findMany({
        where: {
          isAvailable: true,
          name: searchPattern,
        },
        select: { id: true, name: true },
        take: 3,
      });

      products.forEach(p => {
        suggestions.push({ text: p.name, type: 'product', id: p.id });
      });

      // Search strains
      const strains = await db.strain.findMany({
        where: {
          OR: [
            { name: searchPattern },
            { genetics: searchPattern },
          ],
        },
        select: { id: true, name: true, genetics: true },
        take: 3,
      });

      strains.forEach(s => {
        suggestions.push({ text: s.name, type: 'strain', id: s.id });
      });

      // Search growers
      const growers = await db.grower.findMany({
        where: {
          businessName: searchPattern,
        },
        select: { id: true, businessName: true },
        take: 2,
      });

      growers.forEach(g => {
        suggestions.push({ text: g.businessName, type: 'grower', id: g.id });
      });

      // Get matching product types from a static list
      const PRODUCT_TYPES = ['Flower', 'Edibles', 'Cartridge', 'Concentrate', 'Pre-roll', 'Tincture', 'Topical', 'Drink'];
      PRODUCT_TYPES.filter(pt => pt.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 2)
        .forEach(pt => {
          suggestions.push({ text: pt, type: 'category' });
        });
    }

    // Get popular searches (mock data - in production would aggregate from search_logs)
    const popular = [
      { text: 'Blue Dream', type: 'strain' },
      { text: 'OG Kush', type: 'strain' },
      { text: 'Flower', type: 'category' },
      { text: 'Pre-roll', type: 'category' },
    ];

    return NextResponse.json({
      suggestions,
      popular,
      query,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
