import {
  parseProductPayload,
  parseProductNumber,
  PRODUCT_STATUS,
  type ProductStatusValue,
} from '@/lib/product-payload';
import {
  defaultUnitForProductType,
  isKnownProductType,
  PRODUCT_TYPE_NAMES,
} from '@/lib/product-types';

export interface ProductImportError {
  row: number;
  field: string;
  message: string;
}
export interface ProductImportRecord {
  row: number;
  name: string;
  productType: string | null;
  subType: string | null;
  strainName: string | null;
  batchNumber: string | null;
  price: number;
  inventoryQty: number;
  unit: string;
  description: string | null;
  images: string[];
  isAvailable: boolean;
  isPriceVisible: boolean;
  sku: string | null;
  brand: string | null;
  thcMin: number | null;
  thcMax: number | null;
  cbdMin: number | null;
  cbdMax: number | null;
  harvestDate: string | null;
  status: ProductStatusValue;
  requestedAvailability: boolean;
  fields: string[];
}
export interface ProductImportValidationResult {
  totalRows: number;
  records: ProductImportRecord[];
  errors: ProductImportError[];
  rows: string[][];
}
const HEADER_ALIASES: Record<string, string> = {
  name: 'name',
  productname: 'name',
  product: 'name',
  item: 'name',
  itemname: 'name',
  producttype: 'productType',
  type: 'productType',
  category: 'productType',
  subtype: 'subType',
  subcategory: 'subType',
  strain: 'strainName',
  strainname: 'strainName',
  batch: 'batchNumber',
  batchnumber: 'batchNumber',
  price: 'price',
  unitprice: 'price',
  wholesaleprice: 'price',
  wholesale: 'price',
  cost: 'price',
  inventoryqty: 'inventoryQty',
  inventory: 'inventoryQty',
  quantity: 'inventoryQty',
  stock: 'inventoryQty',
  stockonhand: 'inventoryQty',
  qty: 'inventoryQty',
  unit: 'unit',
  units: 'unit',
  sellingunit: 'unit',
  description: 'description',
  images: 'images',
  imageurls: 'images',
  sku: 'sku',
  brand: 'brand',
  isavailable: 'isAvailable',
  available: 'isAvailable',
  live: 'isAvailable',
  ispricevisible: 'isPriceVisible',
  pricevisible: 'isPriceVisible',
  showprice: 'isPriceVisible',
  showpriceyesno: 'isPriceVisible',
  thc: 'thc',
  thclegacy: 'thc',
  cbd: 'cbd',
  cbdlegacy: 'cbd',
  thcmin: 'thcMin',
  thcmax: 'thcMax',
  cbdmin: 'cbdMin',
  cbdmax: 'cbdMax',
  harvestdate: 'harvestDate',
  status: 'status',
  listingstatus: 'status',
};
const normalizeHeader = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '');
function parseBoolean(value: string | undefined, fallback: boolean) {
  if (!value?.trim()) return fallback;
  if (['true', 'yes', 'y', '1'].includes(value.trim().toLowerCase()))
    return true;
  if (['false', 'no', 'n', '0'].includes(value.trim().toLowerCase()))
    return false;
  return null;
}
export function csvCell(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}
export function rowsToCsv(rows: unknown[][]) {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}
export function parseCsv(content: string): string[][] {
  const firstLine = content.replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0] || '';
  let quoted = false;
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0 };
  for (const char of firstLine) {
    if (char === '"') quoted = !quoted;
    else if (!quoted && char in counts) counts[char]++;
  }
  const delimiter = Object.keys(counts).sort(
    (a, b) => counts[b] - counts[a]
  )[0];
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let index = 0; index < content.length; index++) {
    const char = content[index],
      next = content[index + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index++;
      } else inQuotes = !inQuotes;
      continue;
    }
    if (char === delimiter && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }
    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }
    field += char;
  }
  if (inQuotes)
    throw new Error(
      'A quoted cell is not closed. Save the spreadsheet again and retry.'
    );
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}
export function validateProductImport(
  content: string
): ProductImportValidationResult {
  const rows = parseCsv(content),
    [header, ...dataRows] = rows;
  const records: ProductImportRecord[] = [],
    errors: ProductImportError[] = [];
  const totalRows = dataRows.filter((row) =>
    row.some((value) => value.trim())
  ).length;
  const result = () => ({ totalRows, records, errors, rows });
  if (!header || !totalRows) {
    errors.push({
      row: 1,
      field: 'file',
      message: 'The spreadsheet has no product rows.',
    });
    return result();
  }
  const headers = header.map(
    (value) => HEADER_ALIASES[normalizeHeader(value)] || ''
  );
  for (const key of ['name', 'productType', 'price'])
    if (!headers.includes(key))
      errors.push({
        row: 1,
        field: key,
        message: `Missing column: ${{ name: 'Name', productType: 'Type', price: 'Price' }[key]}.`,
      });
  if (errors.length) return result();
  const seen = new Set<string>();
  dataRows.forEach((values, index) => {
    if (!values.some((value) => value.trim())) return;
    const row = index + 2,
      raw: Record<string, string> = {};
    headers.forEach((key, i) => {
      if (key) raw[key] = (values[i] || '').trim();
    });
    const fail = (field: string, message: string) =>
      errors.push({ row, field, message });
    if (!isKnownProductType(raw.productType))
      fail('Type', `Choose a type: ${PRODUCT_TYPE_NAMES.join(', ')}.`);
    const available = parseBoolean(raw.isAvailable, true),
      showPrice = parseBoolean(raw.isPriceVisible, true);
    if (available === null) fail('Available', 'Use yes or no.');
    if (showPrice === null) fail('Show price', 'Use yes or no.');
    const statusText = raw.status?.toLowerCase();
    if (
      statusText &&
      !['draft', 'published', 'live', 'hidden'].includes(statusText)
    )
      fail('Status', 'Use Draft, Live or Hidden.');
    const percentages: Record<string, number | null> = {};
    for (const key of ['thcMin', 'thcMax', 'cbdMin', 'cbdMax']) {
      const value = raw[key] || raw[key.startsWith('thc') ? 'thc' : 'cbd'];
      percentages[key] = value ? parseProductNumber(value) : null;
      if (
        value &&
        (percentages[key] === null ||
          percentages[key]! < 0 ||
          percentages[key]! > 100)
      )
        fail(key, 'Use a percentage from 0 to 100.');
    }
    const parsed = parseProductPayload({
      ...raw,
      ...percentages,
      status:
        statusText === 'draft'
          ? PRODUCT_STATUS.DRAFT
          : PRODUCT_STATUS.PUBLISHED,
      unit: raw.unit || defaultUnitForProductType(raw.productType),
      inventoryQty: raw.inventoryQty || '0',
      images: raw.images
        ? raw.images
            .split(';')
            .map((value) => value.trim())
            .filter(Boolean)
        : [],
      isAvailable: statusText === 'hidden' ? false : (available ?? true),
      isPriceVisible: showPrice ?? true,
    });
    if (!parsed.ok) parsed.errors.forEach((message) => fail('', message));
    const identity = (
      raw.sku ? `sku:${raw.sku}` : `name:${raw.name}`
    ).toLowerCase();
    if (seen.has(identity))
      fail(
        'Name / SKU',
        'This product is repeated in the spreadsheet. Keep one row per product.'
      );
    seen.add(identity);
    if (!parsed.ok || errors.some((error) => error.row === row)) return;
    const data = parsed.data;
    records.push({
      row,
      name: data.name || '',
      productType: data.productType,
      subType: data.subType,
      strainName: raw.strainName || null,
      batchNumber: raw.batchNumber || null,
      price: data.price ?? 0,
      inventoryQty: data.inventoryQty ?? 0,
      unit: data.unit || defaultUnitForProductType(raw.productType),
      description: data.description,
      images: data.images || [],
      isAvailable: data.isAvailable,
      isPriceVisible: data.isPriceVisible,
      sku: data.sku,
      brand: data.brand,
      thcMin: data.thcMin,
      thcMax: data.thcMax,
      cbdMin: data.cbdMin,
      cbdMax: data.cbdMax,
      harvestDate: data.harvestDate,
      status: data.status,
      requestedAvailability:
        !['draft', 'hidden'].includes(statusText || '') && (available ?? true),
      fields: headers.filter(Boolean),
    });
  });
  return result();
}
export function failedProductImportCsv(
  validation: ProductImportValidationResult
) {
  const failed = new Set(validation.errors.map((error) => error.row));
  return rowsToCsv([
    [...(validation.rows[0] || []), 'Error'],
    ...validation.rows.slice(1).flatMap((row, index) =>
      failed.has(index + 2)
        ? [
            [
              ...row,
              validation.errors
                .filter((error) => error.row === index + 2)
                .map((error) => error.message)
                .join(' '),
            ],
          ]
        : []
    ),
  ]);
}
export function productImportTemplateCsv() {
  return rowsToCsv([
    [
      'Name',
      'Type',
      'Price',
      'Stock',
      'Unit',
      'Show price yes/no',
      'SKU',
      'Strain',
      'Batch',
      'THC min',
      'THC max',
      'CBD min',
      'CBD max',
      'Status',
    ],
    [
      'Blue Dream',
      'Flower',
      '1200.00',
      '8',
      'lb',
      'yes',
      'BD-001',
      'Blue Dream',
      '',
      '20',
      '24',
      '',
      '',
      'Live',
    ],
  ]);
}
