import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import { Prisma } from '@prisma/client';

/**
 * Products API Endpoint
 * 
 * Base path: /api/products
 * Authentication: Required (GROWER role)
 * 
 * This endpoint manages cannabis products for authenticated growers.
 * Supports filtering by product type, strain, batch, availability, and search terms.
 */

/**
 * GET /api/products
 * 
 * Retrieves all products for the authenticated grower with optional filtering and sorting.
 * 
 * Query Parameters:
 * - productType (optional): Filter by product type (e.g., 'FLOWER', 'EDIBLE')
 * - strainId (optional): Filter by associated strain ID
 * - batchId (optional): Filter by associated batch ID
 * - isAvailable (optional): Filter by availability status ('true' or 'false')
 * - search (optional): Search in name, strainLegacy, and description fields
 * - sortBy (optional): Sort field, defaults to 'createdAt'
 * - sortOrder (optional): Sort direction ('asc' or 'desc'), defaults to 'desc'
 * 
 * Response: 200 OK - Array of serialized product objects
 * Response: 401 Unauthorized - No valid session
 * Response: 403 Forbidden - User is not a GROWER or has no growerId
 * Response: 500 Internal Server Error - Database or server error
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const growerId = user.growerId;

    const { searchParams } = new URL(request.url);
    const productType = searchParams.get('productType');
    const strainId = searchParams.get('strainId');
    const batchId = searchParams.get('batchId');
    const isAvailable = searchParams.get('isAvailable');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Prisma.ProductWhereInput = {
      growerId,
      isDeleted: false,
      ...(productType && { productType }),
      ...(strainId && { strainId }),
      ...(batchId && { batchId }),
      ...(isAvailable !== null && { isAvailable: isAvailable === 'true' }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { strainLegacy: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const products = await db.product.findMany({
      where,
      include: {
        strain: {
          select: { id: true, name: true, genetics: true }
        },
        batch: {
          select: { 
            id: true, 
            batchNumber: true, 
            harvestDate: true,
            thc: true,
            cbd: true,
            totalCannabinoids: true,
            terpenes: true
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
    });

    const serializedProducts = products.map((p) => ({
      ...p,
      price: p.price ? parseFloat(String(p.price)) : 0,
      thcLegacy: p.thcLegacy ? parseFloat(String(p.thcLegacy)) : null,
      cbdLegacy: p.cbdLegacy ? parseFloat(String(p.cbdLegacy)) : null,
    }));

    return NextResponse.json(serializedProducts, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/products
 * 
 * Creates a new product for the authenticated grower.
 * 
 * Request Body:
 * - name (required): Product name (string)
 * - price (required): Product price as number (will be converted to Decimal)
 * - inventoryQty (required): Stock quantity as integer
 * - unit (required): Unit of measurement (e.g., 'GRAM', 'OUNCE')
 * - productType (optional): Category of product
 * - subType (optional): Sub-category of product
 * - strainId (optional): ID of associated strain (must belong to grower)
 * - batchId (optional): ID of associated batch (must belong to grower)
 * - description (optional): Product description
 * - images (optional): Array of image URLs
 * - isAvailable (optional): Boolean, defaults to true
 * - sku (optional): Stock keeping unit identifier
 * - brand (optional): Brand name
 * - ingredients (optional): List of ingredients
 * - ingredientsDocumentUrl (optional): URL to ingredients document
 * - isFeatured (optional): Boolean, defaults to false
 * - strainLegacy, categoryLegacy, subcategoryLegacy (optional): Legacy fields
 * - thcLegacy, cbdLegacy (optional): Legacy cannabinoid percentages
 * 
 * Response: 201 Created - Newly created product object
 * Response: 400 Bad Request - Missing required fields
 * Response: 401 Unauthorized - No valid session
 * Response: 403 Forbidden - User is not a GROWER
 * Response: 404 Not Found - Associated strain or batch not found
 * Response: 500 Internal Server Error - Database or server error
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const growerId = user.growerId;

    const body = await request.json();
    const {
      name,
      productType,
      subType,
      strainId,
      batchId,
      price,
      inventoryQty,
      unit,
      description,
      images,
      isAvailable = true,
      sku,
      brand,
      ingredients,
      ingredientsDocumentUrl,
      isFeatured = false,
      // Legacy fields for backwards compatibility
      strainLegacy,
      categoryLegacy,
      subcategoryLegacy,
      thcLegacy,
      cbdLegacy,
    } = body;

    if (!name || price === undefined || inventoryQty === undefined || !unit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify strain belongs to grower if provided
    if (strainId) {
      const strain = await db.strain.findFirst({
        where: { id: strainId, growerId }
      });
      if (!strain) {
        return NextResponse.json({ error: 'Strain not found' }, { status: 404 });
      }
    }

    // Verify batch belongs to grower if provided
    if (batchId) {
      const batch = await db.batch.findFirst({
        where: { id: batchId, growerId }
      });
      if (!batch) {
        return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
      }
    }

    const product = await db.product.create({
      data: {
        growerId,
      isDeleted: false,
        name,
        productType: productType || null,
        subType: subType || null,
        strainId: strainId || null,
        batchId: batchId || null,
        strainLegacy: strainLegacy || null,
        categoryLegacy: categoryLegacy || null,
        subcategoryLegacy: subcategoryLegacy || null,
        thcLegacy: thcLegacy !== undefined ? parseFloat(thcLegacy) : null,
        cbdLegacy: cbdLegacy !== undefined ? parseFloat(cbdLegacy) : null,
        price: parseFloat(price),
        inventoryQty: parseInt(inventoryQty),
        unit,
        description: description || null,
        images: images || [],
        isAvailable,
        sku: sku || null,
        brand: brand || null,
        ingredients: ingredients || null,
        ingredientsDocumentUrl: ingredientsDocumentUrl || null,
        isFeatured,
      },
      include: {
        strain: {
          select: { id: true, name: true, genetics: true }
        },
        batch: {
          select: { 
            id: true, 
            batchNumber: true, 
            harvestDate: true,
            thc: true,
            cbd: true,
            totalCannabinoids: true
          }
        }
      }
    });

    const serializedProduct = {
      ...product,
      price: product.price ? parseFloat(String(product.price)) : 0,
      thcLegacy: product.thcLegacy ? parseFloat(String(product.thcLegacy)) : null,
      cbdLegacy: product.cbdLegacy ? parseFloat(String(product.cbdLegacy)) : null,
    };

    return NextResponse.json(serializedProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
