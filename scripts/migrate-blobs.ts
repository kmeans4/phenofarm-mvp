import { Prisma, PrismaClient } from '@prisma/client';
import { decodeDataUri, storeUpload } from '../lib/blob-storage';
import { loadRolloutEnvironment, parseRolloutArgs, targetSummary } from './db-rollout-guard';

type MigrationOptions = ReturnType<typeof parseRolloutArgs>;

type MigrationSummary = {
  dryRun: boolean;
  scanned: number;
  skipped: number;
  uploaded: number;
  wouldUpload: number;
  updatedRows: number;
};

let db: PrismaClient | undefined;

async function main() {
  const options: MigrationOptions = parseRolloutArgs(process.argv.slice(2), {
    mutating: true,
    allowDryRun: true,
  });
  const environment = loadRolloutEnvironment(options);

  if (!options.dryRun && !process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is required for a non-dry-run. No database changes were made.');
  }

  const summary: MigrationSummary = {
    dryRun: options.dryRun,
    scanned: 0,
    skipped: 0,
    uploaded: 0,
    wouldUpload: 0,
    updatedRows: 0,
  };

  db = new PrismaClient();

  async function migrateValue(value: string | null, pathPrefix: string, fileName: string) {
    if (!value) return value;
    summary.scanned += 1;
    if (/^https?:\/\//i.test(value)) {
      summary.skipped += 1;
      return value;
    }

    const decoded = decodeDataUri(value);
    if (!decoded) {
      summary.skipped += 1;
      return value;
    }
    if (options.dryRun) {
      summary.wouldUpload += 1;
      return value;
    }

    const stored = await storeUpload({
      bytes: decoded.bytes,
      mimeType: decoded.mimeType,
      fileName,
      pathPrefix,
    });
    if (!/^https?:\/\//i.test(stored.url)) {
      throw new Error(`Storage returned a non-URL reference for ${pathPrefix}/${fileName}.`);
    }
    summary.uploaded += 1;
    return stored.url;
  }

  // Only labDocuments.dataUrl values are legacy media. Other testResults JSON
  // (metrics, notes, dates, and editor metadata) must remain byte-for-byte intact.
  async function migrateLabDocuments(value: Prisma.JsonValue, pathPrefix: string): Promise<Prisma.JsonValue> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
    const root = value as Prisma.JsonObject;
    const labDocuments = root.labDocuments;
    if (!labDocuments || typeof labDocuments !== 'object' || Array.isArray(labDocuments)) return value;

    let changed = false;
    const documents: Prisma.JsonObject = {};
    for (const [key, item] of Object.entries(labDocuments)) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        documents[key] = item as Prisma.JsonValue;
        continue;
      }
      const record = item as Prisma.JsonObject;
      if (typeof record.dataUrl !== 'string' || !record.dataUrl) {
        documents[key] = record;
        continue;
      }
      const dataUrl = await migrateValue(record.dataUrl, pathPrefix, `${key}.pdf`);
      documents[key] = dataUrl === record.dataUrl ? record : { ...record, dataUrl };
      changed ||= dataUrl !== record.dataUrl;
    }

    return changed ? { ...root, labDocuments: documents } : value;
  }

  const products = await db.product.findMany({
    select: { id: true, growerId: true, images: true, ingredientsDocumentUrl: true, updatedAt: true },
  });
  for (const product of products) {
    const images = await Promise.all(
      product.images.map(async (image, index) =>
        (await migrateValue(image, `products/${product.growerId}/images`, `product-${product.id}-${index}.jpg`)) || image,
      ),
    );
    const ingredientsDocumentUrl = await migrateValue(
      product.ingredientsDocumentUrl,
      `products/${product.growerId}/documents`,
      `ingredients-${product.id}.pdf`,
    );
    if (!options.dryRun && (images.some((image, index) => image !== product.images[index]) || ingredientsDocumentUrl !== product.ingredientsDocumentUrl)) {
      const result = await db.product.updateMany({
        where: { id: product.id, updatedAt: product.updatedAt },
        data: { images, ingredientsDocumentUrl },
      });
      if (result.count !== 1) throw new Error(`Product ${product.id} changed while media migration was running; rerun after review.`);
      summary.updatedRows += 1;
    }
  }

  const batches = await db.batch.findMany({
    select: { id: true, growerId: true, coaDocumentUrl: true, testResults: true, updatedAt: true },
  });
  for (const batch of batches) {
    const coaDocumentUrl = await migrateValue(batch.coaDocumentUrl, `batches/${batch.growerId}/${batch.id}`, 'coa.pdf');
    const testResults = batch.testResults
      ? await migrateLabDocuments(batch.testResults as Prisma.JsonValue, `batches/${batch.growerId}/${batch.id}/lab-results`)
      : null;
    const changed = coaDocumentUrl !== batch.coaDocumentUrl || JSON.stringify(testResults) !== JSON.stringify(batch.testResults);
    if (!options.dryRun && changed) {
      const result = await db.batch.updateMany({
        where: { id: batch.id, updatedAt: batch.updatedAt },
        data: { coaDocumentUrl, testResults: testResults ?? Prisma.JsonNull },
      });
      if (result.count !== 1) throw new Error(`Batch ${batch.id} changed while media migration was running; rerun after review.`);
      summary.updatedRows += 1;
    }
  }

  const growers = await db.grower.findMany({ select: { id: true, logo: true, updatedAt: true } });
  for (const grower of growers) {
    const logo = await migrateValue(grower.logo, `growers/${grower.id}`, 'logo.jpg');
    if (!options.dryRun && logo !== grower.logo) {
      const result = await db.grower.updateMany({ where: { id: grower.id, updatedAt: grower.updatedAt }, data: { logo } });
      if (result.count !== 1) throw new Error(`Grower ${grower.id} changed while media migration was running; rerun after review.`);
      summary.updatedRows += 1;
    }
  }

  const dispensaries = await db.dispensary.findMany({ select: { id: true, logo: true, updatedAt: true } });
  for (const dispensary of dispensaries) {
    const logo = await migrateValue(dispensary.logo, `dispensaries/${dispensary.id}`, 'logo.jpg');
    if (!options.dryRun && logo !== dispensary.logo) {
      const result = await db.dispensary.updateMany({ where: { id: dispensary.id, updatedAt: dispensary.updatedAt }, data: { logo } });
      if (result.count !== 1) throw new Error(`Dispensary ${dispensary.id} changed while media migration was running; rerun after review.`);
      summary.updatedRows += 1;
    }
  }

  console.log(JSON.stringify({ ...targetSummary(environment), ...summary }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (db) await db.$disconnect();
  });
