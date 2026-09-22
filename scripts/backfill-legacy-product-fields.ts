import { chmod, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { loadRolloutEnvironment, parseRolloutArgs, targetSummary } from './db-rollout-guard';

type LegacyProduct = {
  id: string;
  growerId: string;
  thcLegacy: string | null;
  cbdLegacy: string | null;
  strainLegacy: string | null;
  categoryLegacy: string | null;
  subcategoryLegacy: string | null;
  thcMin: string | null;
  thcMax: string | null;
  cbdMin: string | null;
  cbdMax: string | null;
  strainId: string | null;
  strainName: string | null;
  productType: string | null;
  subType: string | null;
};

type BackfillCounts = {
  thc: number;
  cbd: number;
  strain: number;
  productType: number;
  subType: number;
};

function sameDecimal(left: string, right: string) {
  return Number(left) === Number(right);
}

function conflictCounts(products: LegacyProduct[]): BackfillCounts {
  return products.reduce<BackfillCounts>((counts, product) => {
    if (product.thcLegacy !== null && ((product.thcMin !== null && !sameDecimal(product.thcMin, product.thcLegacy)) || (product.thcMax !== null && !sameDecimal(product.thcMax, product.thcLegacy)))) counts.thc += 1;
    if (product.cbdLegacy !== null && ((product.cbdMin !== null && !sameDecimal(product.cbdMin, product.cbdLegacy)) || (product.cbdMax !== null && !sameDecimal(product.cbdMax, product.cbdLegacy)))) counts.cbd += 1;
    if (product.strainLegacy?.trim() && product.strainName?.trim() && product.strainLegacy.trim() !== product.strainName.trim()) counts.strain += 1;
    if (product.categoryLegacy?.trim() && product.productType?.trim() && product.categoryLegacy.trim() !== product.productType.trim()) counts.productType += 1;
    if (product.subcategoryLegacy?.trim() && product.subType?.trim() && product.subcategoryLegacy.trim() !== product.subType.trim()) counts.subType += 1;
    return counts;
  }, { thc: 0, cbd: 0, strain: 0, productType: 0, subType: 0 });
}

let db: PrismaClient | undefined;

function plannedCounts(products: LegacyProduct[]): BackfillCounts {
  return products.reduce<BackfillCounts>((counts, product) => {
    if (product.thcLegacy !== null && (product.thcMin === null || product.thcMax === null)) counts.thc += 1;
    if (product.cbdLegacy !== null && (product.cbdMin === null || product.cbdMax === null)) counts.cbd += 1;
    if (product.strainLegacy?.trim() && !product.strainId) counts.strain += 1;
    if (product.categoryLegacy?.trim() && !product.productType?.trim()) counts.productType += 1;
    if (product.subcategoryLegacy?.trim() && !product.subType?.trim()) counts.subType += 1;
    return counts;
  }, { thc: 0, cbd: 0, strain: 0, productType: 0, subType: 0 });
}

async function main() {
  const options = parseRolloutArgs(process.argv.slice(2), { mutating: true, allowDryRun: true });
  const environment = loadRolloutEnvironment(options);
  db = new PrismaClient();

  const products = await db.$queryRawUnsafe<LegacyProduct[]>(`
    SELECT p.id, p."growerId", p."thcLegacy"::text AS "thcLegacy", p."cbdLegacy"::text AS "cbdLegacy", p."strainLegacy",
           p."categoryLegacy", p."subcategoryLegacy", p."thcMin"::text, p."thcMax"::text,
           p."cbdMin"::text, p."cbdMax"::text, p."strainId", s.name AS "strainName", p."productType", p."subType"
    FROM products p
    LEFT JOIN strains s ON s.id = p."strainId"
    WHERE p."thcLegacy" IS NOT NULL
       OR p."cbdLegacy" IS NOT NULL
       OR NULLIF(BTRIM(p."strainLegacy"), '') IS NOT NULL
       OR NULLIF(BTRIM(p."categoryLegacy"), '') IS NOT NULL
       OR NULLIF(BTRIM(p."subcategoryLegacy"), '') IS NOT NULL
    ORDER BY p.id
  `);

  const counts = plannedCounts(products);
  const conflicts = conflictCounts(products);
  const conflictTotal = Object.values(conflicts).reduce((total, count) => total + count, 0);
  if (options.dryRun) {
    console.log(JSON.stringify({ ...targetSummary(environment), dryRun: true, scannedProducts: products.length, planned: counts, conflicts }, null, 2));
    return;
  }
  if (conflictTotal > 0) {
    throw new Error(`Legacy conflict check failed (${conflictTotal} field conflicts). Resolve or explicitly review differing populated values before dropping legacy columns.`);
  }

  const defaultBackup = path.join(process.cwd(), '.codex', 'tmp', `legacy-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  const backupPath = options.backupFile
    ? path.resolve(process.cwd(), options.backupFile)
    : options.target === 'local'
      ? defaultBackup
      : null;
  if (!backupPath) {
    throw new Error('Production backfill requires --backup-file=/path/to/legacy-backup.json. No database changes were made.');
  }

  await mkdir(path.dirname(backupPath), { recursive: true });
  await writeFile(
    backupPath,
    JSON.stringify({ createdAt: new Date().toISOString(), target: options.target, products }, null, 2),
    { flag: 'wx', mode: 0o600 },
  );
  await chmod(backupPath, 0o600);
  console.log(`Backup written before mutation: ${backupPath}`);

  const applied: BackfillCounts = { thc: 0, cbd: 0, strain: 0, productType: 0, subType: 0 };
  for (const product of products) {
    await db.$transaction(async (tx) => {
      if (product.thcLegacy !== null && (product.thcMin === null || product.thcMax === null)) {
        const result = await tx.$executeRawUnsafe(
          `UPDATE products
           SET "thcMin" = COALESCE("thcMin", $1::numeric), "thcMax" = COALESCE("thcMax", $1::numeric)
           WHERE id = $2 AND ("thcMin" IS NULL OR "thcMax" IS NULL)`,
          product.thcLegacy,
          product.id,
        );
        if (result > 0) applied.thc += 1;
      }

      if (product.cbdLegacy !== null && (product.cbdMin === null || product.cbdMax === null)) {
        const result = await tx.$executeRawUnsafe(
          `UPDATE products
           SET "cbdMin" = COALESCE("cbdMin", $1::numeric), "cbdMax" = COALESCE("cbdMax", $1::numeric)
           WHERE id = $2 AND ("cbdMin" IS NULL OR "cbdMax" IS NULL)`,
          product.cbdLegacy,
          product.id,
        );
        if (result > 0) applied.cbd += 1;
      }

      const strainName = product.strainLegacy?.trim();
      if (strainName && !product.strainId) {
        const strains = await tx.$queryRawUnsafe<Array<{ id: string }>>(
          `INSERT INTO strains (id, name, "growerId", "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
           ON CONFLICT ("growerId", name) DO UPDATE SET name = strains.name
           RETURNING id`,
          strainName,
          product.growerId,
        );
        const strainId = strains[0]?.id;
        if (!strainId) throw new Error(`Could not resolve strain for product ${product.id}.`);
        const result = await tx.$executeRawUnsafe(
          `UPDATE products SET "strainId" = $1 WHERE id = $2 AND "strainId" IS NULL`,
          strainId,
          product.id,
        );
        if (result > 0) applied.strain += 1;
      }

      const productType = product.categoryLegacy?.trim();
      if (productType && !product.productType?.trim()) {
        const result = await tx.$executeRawUnsafe(
          `UPDATE products SET "productType" = $1 WHERE id = $2 AND ("productType" IS NULL OR BTRIM("productType") = '')`,
          productType,
          product.id,
        );
        if (result > 0) applied.productType += 1;
      }

      const subType = product.subcategoryLegacy?.trim();
      if (subType && !product.subType?.trim()) {
        const result = await tx.$executeRawUnsafe(
          `UPDATE products SET "subType" = $1 WHERE id = $2 AND ("subType" IS NULL OR BTRIM("subType") = '')`,
          subType,
          product.id,
        );
        if (result > 0) applied.subType += 1;
      }
    });
  }

  console.log(JSON.stringify({ ...targetSummary(environment), dryRun: false, scannedProducts: products.length, applied, backupPath }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (db) await db.$disconnect();
  });
