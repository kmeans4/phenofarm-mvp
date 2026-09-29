import { priceRangesForUnit } from '@/lib/catalog-filters';
import { db } from '@/lib/db';
import { expandProductTypeFilters } from '@/lib/product-types';
import { Prisma } from '@prisma/client';
import { startOfLicenseDay } from '@/lib/license';
import {
  buyerProductSelect,
  buyerProductWhere,
  serializeBuyerProducts,
  parsePage,
  normalizeProductIds,
} from '@/lib/buyer-products';

const THC_RANGES = {
  low: [0, 15],
  medium: [15, 20],
  high: [20, 25],
  'very-high': [25, 100],
} as const;

export async function getBuyerCatalog(
  dispensaryId: string,
  params: URLSearchParams
) {
  const page = parsePage(params.get('page'));
  const limit = parsePage(params.get('limit'), 20, 100);
  const cursor = params.get('cursor');
  const recentlyAdded = params.get('recentlyAdded') === 'true';
  const trending = params.get('trending') === 'true';
  const growerId = params.get('growerId');
  const search = params.get('search')?.trim().slice(0, 160);
  const now = new Date();
  const conditions = [
    Prisma.sql`p."isAvailable" AND NOT p."isDeleted" AND p.status = 'PUBLISHED' `,
    Prisma.sql`g."isVerified" AND (g."licenseExpiry" IS NULL OR g."licenseExpiry" >= ${startOfLicenseDay(now)})`,
  ];
  if (growerId) conditions.push(Prisma.sql`p."growerId" = ${growerId}`);
  if (recentlyAdded)
    conditions.push(
      Prisma.sql`p."createdAt" >= ${new Date(now.getTime() - 7 * 86400000)}`
    );
  if (params.get('favorites') === 'true') {
    if (params.has('favoriteIds')) {
      const ids = normalizeProductIds(params.get('favoriteIds')?.split(','));
      conditions.push(
        ids.length
          ? Prisma.sql`p.id IN (${Prisma.join(ids)})`
          : Prisma.sql`FALSE`
      );
    } else {
      conditions.push(
        Prisma.sql`EXISTS (SELECT 1 FROM dispensary_favorite_products f WHERE f."productId" = p.id AND f."dispensaryId" = ${dispensaryId})`
      );
    }
  }
  const searchWords = (search || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 12);
  const haystack = Prisma.sql`concat_ws(' ', p.name, g."businessName", p."productType", s.name)`;
  for (const word of searchWords) {
    const pattern = `%${word.replace(/[\\%_]/g, '\\$&')}%`;
    conditions.push(
      Prisma.sql`(${haystack} ILIKE ${pattern} OR word_similarity(${word}, ${haystack}) >= 0.42)`
    );
  }
  if (params.get('inStock') === 'true')
    conditions.push(Prisma.sql`p."inventoryQty" > 0`);
  if (params.get('hasLabs') === 'true')
    conditions.push(Prisma.sql`(NULLIF(b."coaDocumentUrl", '') IS NOT NULL OR EXISTS (
    SELECT 1 FROM jsonb_each(CASE WHEN jsonb_typeof(b."testResults" -> 'labDocuments') = 'object' THEN b."testResults" -> 'labDocuments' ELSE '{}'::jsonb END) document
    WHERE document.key IN ('coa', 'cannabinoids', 'pesticides', 'microbials') AND NULLIF(document.value ->> 'dataUrl', '') IS NOT NULL
  ))`);
  if (params.get('strainType'))
    conditions.push(
      Prisma.sql`s."strainType"::text = ${params.get('strainType')}`
    );
  if (params.get('priceUnit')) {
    const unit = params.get('priceUnit')!.toLowerCase();
    const aliases: Record<string, string[]> = {
      lb: ['lb', 'lbs', 'pound', 'pounds'],
      gram: ['gram', 'grams', 'g'],
      ounce: ['ounce', 'ounces', 'oz'],
    };
    conditions.push(
      Prisma.sql`lower(p.unit) IN (${Prisma.join(aliases[unit] || [unit])})`
    );
  }
  const thcConditions = (params.get('thcRanges') || '')
    .split(',')
    .flatMap((key) => {
      const range = THC_RANGES[key as keyof typeof THC_RANGES];
      return range
        ? [
            Prisma.sql`COALESCE(b.thc, p."thcMax", p."thcMin") >= ${range[0]} AND COALESCE(b.thc, p."thcMax", p."thcMin") < ${range[1]}`,
          ]
        : [];
    });
  if (thcConditions.length)
    conditions.push(
      Prisma.sql`(${Prisma.join(
        thcConditions.map((condition) => Prisma.sql`(${condition})`),
        ' OR '
      )})`
    );
  const priceConditions = (params.get('priceRanges') || '')
    .split(',')
    .flatMap((key) => {
      const range = priceRangesForUnit(
        params.get('priceUnit') || undefined
      ).find((range) => range.id === key);
      return range
        ? [Prisma.sql`p.price >= ${range.min} AND p.price < ${range.max}`]
        : [];
    });
  if (priceConditions.length && params.get('priceUnit'))
    conditions.push(
      Prisma.sql`p."isPriceVisible" AND (${Prisma.join(
        priceConditions.map((condition) => Prisma.sql`(${condition})`),
        ' OR '
      )})`
    );
  const types = expandProductTypeFilters(
    (params.get('productTypes') || '').split(',').filter(Boolean)
  );
  const typeFilter = types.length
    ? Prisma.sql`"productType" IN (${Prisma.join(types)})`
    : Prisma.sql`TRUE`;
  const volumeJoin = trending
    ? Prisma.sql`JOIN (
    SELECT oi."productId", SUM(oi.quantity) AS volume FROM order_items oi JOIN orders o ON o.id = oi."orderId"
    WHERE oi."createdAt" >= ${new Date(now.getTime() - 30 * 86400000)} AND o.status != 'CANCELLED'
    GROUP BY oi."productId"
  ) sales ON sales."productId" = p.id`
    : Prisma.empty;
  // All filters/facets share this predicate. Only a capped page of IDs leaves SQL.
  const eligible = Prisma.sql`SELECT p.id, p.name, p."growerId", ${
    searchWords.length
      ? Prisma.sql`(${Prisma.join(
          searchWords.map(
            (word) => Prisma.sql`word_similarity(${word}, ${haystack})`
          ),
          ' + '
        )})`
      : Prisma.sql`0`
  } AS relevance, p."productType", p."createdAt", g."businessName",
    CASE WHEN p."isPriceVisible" THEN p.price END AS "visiblePrice",
    COALESCE(b.thc, p."thcMax", p."thcMin") AS thc, ${trending ? Prisma.sql`sales.volume` : Prisma.sql`0`} AS volume
    FROM products p JOIN growers g ON g.id = p."growerId"
    LEFT JOIN batches b ON b.id = p."batchId" LEFT JOIN strains s ON s.id = p."strainId"
    ${volumeJoin} WHERE ${Prisma.join(
      conditions.map((condition) => Prisma.sql`(${condition})`),
      ' AND '
    )}`;
  let order = search
    ? Prisma.sql`relevance DESC, "createdAt" DESC, id ASC`
    : Prisma.sql`"createdAt" DESC, id ASC`;
  switch (params.get('sortBy')) {
    // Hidden prices are never used as sort keys, including between hidden rows.
    case 'newest':
      order = Prisma.sql`"createdAt" DESC, id ASC`;
      break;
    case 'price-asc':
      order = Prisma.sql`"visiblePrice" ASC NULLS LAST, name ASC, id ASC`;
      break;
    case 'price-desc':
      order = Prisma.sql`"visiblePrice" DESC NULLS LAST, name ASC, id ASC`;
      break;
    case 'thc-asc':
      order = Prisma.sql`thc ASC NULLS LAST, name ASC, id ASC`;
      break;
    case 'thc-desc':
      order = Prisma.sql`thc DESC NULLS LAST, name ASC, id ASC`;
      break;
    case 'name-asc':
      order = Prisma.sql`name ASC, id ASC`;
      break;
    case 'name-desc':
      order = Prisma.sql`name DESC, id DESC`;
      break;
  }
  if (trending) order = Prisma.sql`volume DESC, id ASC`;
  const offset = cursor
    ? Prisma.sql`COALESCE((SELECT position FROM ranked WHERE id = ${cursor}), 9223372036854775807)`
    : Prisma.sql`${(page - 1) * limit}`;
  const [totals, facets, ids, growers] = await Promise.all([
    db.$queryRaw<{ total: number }[]>(
      Prisma.sql`WITH eligible AS (${eligible}) SELECT COUNT(*)::int AS total FROM eligible WHERE ${typeFilter}`
    ),
    db.$queryRaw<{ productType: string; count: number }[]>(
      Prisma.sql`WITH eligible AS (${eligible}) SELECT "productType", COUNT(*)::int AS count FROM eligible GROUP BY "productType"`
    ),
    db.$queryRaw<
      { id: string }[]
    >(Prisma.sql`WITH eligible AS (${eligible}), ranked AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY ${order}) AS position FROM eligible WHERE ${typeFilter}
    ) SELECT id FROM ranked WHERE position > ${offset} ORDER BY position LIMIT ${limit + 1}`),
    db.$queryRaw<{ id: string; name: string }[]>(
      Prisma.sql`SELECT id, "businessName" AS name FROM growers WHERE "isVerified" AND ("licenseExpiry" IS NULL OR "licenseExpiry" >= ${startOfLicenseDay(now)}) ORDER BY "businessName" LIMIT 500`
    ),
  ]);
  const pageIds = ids.slice(0, limit).map((row) => row.id);
  const rows = pageIds.length
    ? await db.product.findMany({
        where: {
          ...buyerProductWhere(),
          isAvailable: true,
          id: { in: pageIds },
        },
        select: buyerProductSelect,
      })
    : [];
  const byId = new Map(rows.map((row) => [row.id, row]));
  const products = await serializeBuyerProducts(
    pageIds.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []))
  );
  const productTypeCounts = Object.fromEntries(
    facets
      .filter((row) => row.productType?.trim())
      .map((row) => [row.productType.trim(), row.count])
  );
  const hasMore = ids.length > limit;
  return {
    products,
    growers,
    hasMore,
    total: totals[0].total,
    page,
    limit,
    recentlyAdded,
    trending,
    productTypeCounts,
    nextCursor: hasMore ? products.at(-1)?.id || null : null,
  };
}

export type BuyerCatalogPage = Awaited<ReturnType<typeof getBuyerCatalog>>;
