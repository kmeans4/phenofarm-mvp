import { PrismaClient } from '@prisma/client';
import { loadRolloutEnvironment, parseRolloutArgs, targetSummary } from './db-rollout-guard';

const targetTables = ['sessions', 'payments', 'carts', 'cart_items'] as const;
let db: PrismaClient | undefined;

async function tableCount(table: (typeof targetTables)[number]) {
  const exists = await db!.$queryRawUnsafe<Array<{ exists: string | null }>>(
    `SELECT to_regclass('public.${table}')::text AS exists`,
  );
  if (!exists[0]?.exists) return null;
  const rows = await db!.$queryRawUnsafe<Array<{ count: bigint }>>(`SELECT COUNT(*)::bigint AS count FROM "${table}"`);
  return Number(rows[0].count);
}

async function main() {
  const options = parseRolloutArgs(process.argv.slice(2), { mutating: false });
  const environment = loadRolloutEnvironment(options);
  db = new PrismaClient();

  const tableCounts = Object.fromEntries(
    await Promise.all(targetTables.map(async (table) => [table, await tableCount(table)] as const)),
  ) as Record<(typeof targetTables)[number], number | null>;
  const legacy = await db.$queryRawUnsafe<Array<{ unmigrated: bigint }>>(`
    SELECT COUNT(*)::bigint AS unmigrated
    FROM products
    WHERE ("thcLegacy" IS NOT NULL AND ("thcMin" IS NULL OR "thcMax" IS NULL))
       OR ("cbdLegacy" IS NOT NULL AND ("cbdMin" IS NULL OR "cbdMax" IS NULL))
       OR (NULLIF(BTRIM("strainLegacy"), '') IS NOT NULL AND "strainId" IS NULL)
       OR (NULLIF(BTRIM("categoryLegacy"), '') IS NOT NULL AND ("productType" IS NULL OR BTRIM("productType") = ''))
       OR (NULLIF(BTRIM("subcategoryLegacy"), '') IS NOT NULL AND ("subType" IS NULL OR BTRIM("subType") = ''))
  `);
  const conflicts = await db.$queryRawUnsafe<Array<{ conflicts: bigint }>>(`
    SELECT COUNT(*)::bigint AS conflicts
    FROM products p
    LEFT JOIN strains s ON s.id = p."strainId"
    WHERE (p."thcLegacy" IS NOT NULL AND ((p."thcMin" IS NOT NULL AND p."thcMin" <> p."thcLegacy") OR (p."thcMax" IS NOT NULL AND p."thcMax" <> p."thcLegacy")))
       OR (p."cbdLegacy" IS NOT NULL AND ((p."cbdMin" IS NOT NULL AND p."cbdMin" <> p."cbdLegacy") OR (p."cbdMax" IS NOT NULL AND p."cbdMax" <> p."cbdLegacy")))
       OR (NULLIF(BTRIM(p."strainLegacy"), '') IS NOT NULL AND NULLIF(BTRIM(s.name), '') IS NOT NULL AND BTRIM(p."strainLegacy") <> BTRIM(s.name))
       OR (NULLIF(BTRIM(p."categoryLegacy"), '') IS NOT NULL AND NULLIF(BTRIM(p."productType"), '') IS NOT NULL AND BTRIM(p."categoryLegacy") <> BTRIM(p."productType"))
       OR (NULLIF(BTRIM(p."subcategoryLegacy"), '') IS NOT NULL AND NULLIF(BTRIM(p."subType"), '') IS NOT NULL AND BTRIM(p."subcategoryLegacy") <> BTRIM(p."subType"))
  `);
  const unmigratedLegacyProducts = Number(legacy[0]?.unmigrated ?? 0);
  const legacyConflicts = Number(conflicts[0]?.conflicts ?? 0);
  const missingTables = targetTables.filter((table) => tableCounts[table] === null);
  const populatedTables = targetTables.filter((table) => (tableCounts[table] ?? 0) > 0);

  console.log(JSON.stringify({
    ...targetSummary(environment),
    tableCounts,
    missingTables,
    unmigratedLegacyProducts,
    legacyConflicts,
  }, null, 2));

  if (missingTables.length) {
    throw new Error(`Drop safety check failed: expected pre-drop tables are missing (${missingTables.join(', ')}).`);
  }
  if (populatedTables.length || unmigratedLegacyProducts > 0 || legacyConflicts > 0) {
    throw new Error('Drop safety check failed. Cleanup/backfill the connected database before applying the destructive migration.');
  }

  console.log('Drop safety check passed for the connected database.');
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (db) await db.$disconnect();
  });
