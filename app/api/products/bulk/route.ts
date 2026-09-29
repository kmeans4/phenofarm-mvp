import { refreshProductPriceAlerts } from '@/lib/buyer-alerts';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import {
  failedProductImportCsv,
  productImportTemplateCsv,
  rowsToCsv,
  validateProductImport,
  type ProductImportRecord,
} from '@/lib/product-import';
import { validateCsvImportFile } from '@/lib/upload-validation';
import {
  canCreateListings,
  FREE_LISTING_LIMIT_MESSAGE,
  getGrowerPlanLimits,
} from '@/lib/plans';

async function spreadsheetContent(file: File): Promise<string> {
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    const content = await file.text();
    if (content.includes('\u0000'))
      throw new Error(
        'This is not a text spreadsheet. Export it as CSV or upload an .xlsx file.'
      );
    return content;
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  // Bound decompressed XML before ExcelJS allocates workbook structures.
  let directoryEnd = -1;
  for (
    let offset = bytes.length - 22;
    offset >= Math.max(0, bytes.length - 65557);
    offset--
  ) {
    if (bytes.readUInt32LE(offset) === 0x06054b50) {
      directoryEnd = offset;
      break;
    }
  }
  if (directoryEnd < 0) throw new Error('This is not a valid Excel workbook.');
  const entryCount = bytes.readUInt16LE(directoryEnd + 10);
  let cursor = bytes.readUInt32LE(directoryEnd + 16),
    expandedBytes = 0;
  if (entryCount > 1000 || entryCount === 0xffff)
    throw new Error(
      'This workbook is too complex. Export its product sheet as CSV.'
    );
  for (let index = 0; index < entryCount; index++) {
    if (cursor + 46 > bytes.length || bytes.readUInt32LE(cursor) !== 0x02014b50)
      throw new Error(
        'This Excel workbook is damaged. Save it again and retry.'
      );
    expandedBytes += bytes.readUInt32LE(cursor + 24);
    if (expandedBytes > 30_000_000)
      throw new Error(
        'This workbook is too large after expansion. Export its product sheet as CSV.'
      );
    cursor +=
      46 +
      bytes.readUInt16LE(cursor + 28) +
      bytes.readUInt16LE(cursor + 30) +
      bytes.readUInt16LE(cursor + 32);
  }
  const { Workbook } = await import('exceljs');
  const workbook = new Workbook();
  await workbook.xlsx.load(bytes as unknown as ArrayBuffer);
  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount > 5000 || sheet.columnCount > 100)
    throw new Error('Use a spreadsheet with up to 5,000 rows and 100 columns.');
  const rows: string[][] = [];
  sheet.eachRow({ includeEmpty: true }, (row) => {
    const values: string[] = [];
    for (let i = 1; i <= sheet.columnCount; i++)
      values.push(row.getCell(i).text);
    rows.push(values);
  });
  return rowsToCsv(rows);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session)
      return NextResponse.json(
        { error: 'Please sign in to continue.' },
        { status: 401 }
      );
    const growerId = session.user.growerId;
    if (session.user.role !== 'GROWER' || !growerId)
      return NextResponse.json(
        { error: 'Your account does not have access to this action.' },
        { status: 403 }
      );
    const form = await request.formData(),
      file = form.get('file'),
      dryRun = form.get('dryRun') === 'true';
    if (!(file instanceof File))
      return NextResponse.json(
        { error: 'Choose a spreadsheet.' },
        { status: 400 }
      );
    const checked = validateCsvImportFile(file);
    if (!checked.ok)
      return NextResponse.json({ error: checked.error }, { status: 400 });
    let validation;
    try {
      validation = validateProductImport(await spreadsheetContent(file));
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Could not read this spreadsheet.',
        },
        { status: 422 }
      );
    }
    if (validation.totalRows > 5000)
      return NextResponse.json(
        { error: 'Import up to 5,000 rows at a time.' },
        { status: 400 }
      );
    const result = await db.$transaction(
      async (tx) => {
        // Serialize imports for this grower so retries and simultaneous files cannot create duplicates.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`product-import:${growerId}`}))`;
        const [plan, existing, strains, batches] = await Promise.all([
          tx.grower.findUnique({
            where: { id: growerId },
            select: { subscriptionPlan: true, subscriptionStatus: true },
          }),
          tx.product.findMany({
            where: { growerId, isDeleted: false },
            select: {
              id: true,
              sku: true,
              name: true,
              inventoryQty: true,
              status: true,
              isAvailable: true,
            },
          }),
          tx.strain.findMany({
            where: { growerId },
            select: { id: true, name: true },
          }),
          tx.batch.findMany({
            where: { growerId },
            select: { id: true, batchNumber: true, strainId: true },
          }),
        ]);
        if (!getGrowerPlanLimits(plan).csvImport && validation.totalRows > 25)
          return {
            error:
              'Free includes imports of up to 25 rows. Split your file or compare plans.',
            status: 402,
          };
        const prepared: Array<{
          record: ProductImportRecord;
          id?: string;
          strainId?: string;
          batchId?: string;
        }> = [];
        const matchedIds = new Set<string>();
        for (const record of validation.records) {
          const skuMatches = record.sku
            ? existing.filter(
                (product) =>
                  product.sku?.toLowerCase() === record.sku?.toLowerCase()
              )
            : [];
          const matches = skuMatches.length
            ? skuMatches
            : existing.filter(
                (product) =>
                  product.name.toLowerCase() === record.name.toLowerCase()
              );
          if (
            matches.length > 1 ||
            (matches[0] && matchedIds.has(matches[0].id))
          ) {
            validation.errors.push({
              row: record.row,
              field: 'SKU',
              message:
                'More than one row matches this product. Give each product a unique SKU.',
            });
            continue;
          }
          const batch = record.batchNumber
            ? batches.find(
                (batch) =>
                  batch.batchNumber.toLowerCase() ===
                  record.batchNumber?.toLowerCase()
              )
            : undefined;
          if (record.batchNumber && !batch) {
            validation.errors.push({
              row: record.row,
              field: 'Batch',
              message:
                'Batch not found. Add it under Batches, then import this row again.',
            });
            continue;
          }
          if (matches[0]) matchedIds.add(matches[0].id);
          prepared.push({
            record,
            id: matches[0]?.id,
            batchId: batch?.id,
            strainId:
              batch?.strainId ||
              strains.find(
                (strain) =>
                  strain.name.toLowerCase() === record.strainName?.toLowerCase()
              )?.id,
          });
        }
        const createCount = prepared.filter((row) => !row.id).length,
          updateCount = prepared.length - createCount;
        const preview = {
          totalRows: validation.totalRows,
          validRows: prepared.length,
          errorRows: new Set(validation.errors.map((item) => item.row)).size,
          createCount,
          updateCount,
          errors: validation.errors,
          failedRowsCsv: validation.errors.length
            ? failedProductImportCsv(validation)
            : null,
          records: prepared.map(({ record, id }) => ({
            row: record.row,
            action: id ? 'update' : 'create',
            name: record.name,
            productType: record.productType,
            price: record.price,
          })),
        };
        if (dryRun) return { ...preview, dryRun: true };
        if (!prepared.length)
          return {
            ...preview,
            error: 'No valid products to import.',
            status: 422,
          };
        if (!canCreateListings(plan, existing.length, createCount))
          return { ...preview, error: FREE_LISTING_LIMIT_MESSAGE, status: 402 };
        const updatedIds: string[] = [];
        for (const item of prepared) {
          const { record, id, batchId } = item;
          let strainId = item.strainId;
          if (!strainId && record.strainName) {
            const name = record.strainName;
            const found = strains.find(
              (strain) => strain.name.toLowerCase() === name.toLowerCase()
            );
            if (found) strainId = found.id;
            else {
              const created = await tx.strain.create({
                data: { growerId, name },
                select: { id: true, name: true },
              });
              strains.push(created);
              strainId = created.id;
            }
          }
          const {
            row: _row,
            fields,
            strainName: _strain,
            batchNumber: _batch,
            harvestDate,
            requestedAvailability,
            ...values
          } = record;
          void _row;
          void _strain;
          void _batch;
          const data = {
            ...values,
            harvestDate: harvestDate ? new Date(harvestDate) : null,
            strainId: strainId || null,
            batchId: batchId || null,
          };
          if (id) {
            // Omitted columns preserve existing details. An explicitly empty cell clears that column.
            const update: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(data))
              if (
                fields.includes(key) ||
                (key === 'strainId' &&
                  (fields.includes('strainName') || Boolean(batchId))) ||
                (key === 'batchId' && fields.includes('batchNumber')) ||
                (/^(thc|cbd)(Min|Max)$/.test(key) &&
                  fields.includes(key.slice(0, 3)))
              )
                update[key] = value;
            const current = existing.find((product) => product.id === id)!;
            const quantity =
              typeof update.inventoryQty === 'number'
                ? update.inventoryQty
                : current.inventoryQty;
            const status =
              typeof update.status === 'string'
                ? update.status
                : current.status;
            if (fields.includes('isAvailable') || fields.includes('status'))
              update.isAvailable = requestedAvailability;
            if (quantity === 0 || status === 'DRAFT')
              update.isAvailable = false;
            await tx.product.update({
              where: { id },
              data: update as Prisma.ProductUncheckedUpdateInput,
            });
            updatedIds.push(id);
          } else
            await tx.product.create({
              data: { ...data, growerId, isDeleted: false },
            });
        }
        return {
          ...preview,
          success: true,
          updatedIds,
          successCount: prepared.length,
        };
      },
      { timeout: 60000 }
    );
    if ('updatedIds' in result && Array.isArray(result.updatedIds))
      await Promise.all(
        result.updatedIds.map((id) =>
          refreshProductPriceAlerts(id).catch((error) =>
            console.error('Price alert refresh failed:', error)
          )
        )
      );
    return NextResponse.json(result, {
      status:
        'status' in result && typeof result.status === 'number'
          ? result.status
          : 200,
    });
  } catch (error) {
    console.error('Error importing products:', error);
    return NextResponse.json(
      { error: 'Import could not be completed. Your file is safe to retry.' },
      { status: 500 }
    );
  }
}
export async function GET(request: NextRequest) {
  if (new URL(request.url).searchParams.get('template') !== 'true')
    return NextResponse.json(
      { error: 'Template not specified' },
      { status: 400 }
    );
  return new NextResponse(productImportTemplateCsv(), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=product-template.csv',
    },
  });
}
