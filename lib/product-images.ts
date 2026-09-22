import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

// Call only with IDs obtained from an authorized product query. PostgreSQL projects
// one bounded reference; legacy image bodies never travel in a list response.
export async function productImagesById(ids: string[]) {
  if (!ids.length) return new Map<string, string[]>();
  const rows = await db.$queryRaw<Array<{ id: string; source: string | null; legacy: boolean }>>(Prisma.sql`
    SELECT id,
      CASE WHEN length(images[1]) <= 2048 AND
        (images[1] ~ '^https?://' OR images[1] ~ '^/uploads/[a-zA-Z0-9-]+[.](png|jpg|jpeg|webp)$')
        THEN images[1] ELSE NULL END AS source,
      COALESCE(images[1] ~ '^data:image/(png|jpeg|webp|gif);base64,', false) AS legacy
    FROM products WHERE id IN (${Prisma.join(ids)})`);
  return new Map(rows.map(row => [row.id, row.source ? [row.source] : row.legacy
    ? [`/api/dispensary/products/${encodeURIComponent(row.id)}/thumbnail`] : []]));
}
