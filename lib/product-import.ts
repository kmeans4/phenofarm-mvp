import { parseProductPayload, PRODUCT_STATUS } from '@/lib/product-payload';

export interface ProductImportError {
  row: number;
  field: string;
  message: string;
}

export interface ProductImportRecord {
  name: string;
  productType: string | null;
  subType: string | null;
  strainName: string | null;
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
}

export interface ProductImportValidationResult {
  totalRows: number;
  records: ProductImportRecord[];
  errors: ProductImportError[];
}

type ProductImportField = keyof ProductImportRecord | 'strain' | 'category' | 'subcategory' | 'thc' | 'cbd';

const HEADER_ALIASES: Record<string, ProductImportField> = {
  name: 'name',
  productname: 'name',
  product: 'name',
  producttype: 'productType',
  type: 'productType',
  category: 'category',
  subtype: 'subType',
  subcategory: 'subcategory',
  strain: 'strain',
  price: 'price',
  unitprice: 'price',
  inventoryqty: 'inventoryQty',
  inventory: 'inventoryQty',
  quantity: 'inventoryQty',
  stock: 'inventoryQty',
  unit: 'unit',
  description: 'description',
  images: 'images',
  imageurls: 'images',
  sku: 'sku',
  brand: 'brand',
  isavailable: 'isAvailable',
  available: 'isAvailable',
  ispricevisible: 'isPriceVisible',
  pricevisible: 'isPriceVisible',
  showprice: 'isPriceVisible',
  thc: 'thc',
  thclegacy: 'thc',
  cbd: 'cbd',
  cbdlegacy: 'cbd',
};

const REQUIRED_FIELDS = ['name', 'productType', 'price', 'inventoryQty', 'unit'] as const;

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function toOptionalString(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed) return fallback;
  if (['true', 'yes', 'y', '1'].includes(trimmed)) return true;
  if (['false', 'no', 'n', '0'].includes(trimmed)) return false;
  return null;
}

function parseOptionalPercent(value: string | undefined) {
  if (!value?.trim()) return { value: null, valid: true };
  const parsed = Number.parseFloat(value);
  return {
    value: parsed,
    valid: Number.isFinite(parsed) && parsed >= 0 && parsed <= 100,
  };
}

function splitImageList(value: string | undefined) {
  return value
    ? value.split(';').map((item) => item.trim()).filter(Boolean)
    : [];
}

function hasRequiredField(
  presentFields: Set<ProductImportField>,
  requiredField: typeof REQUIRED_FIELDS[number]
) {
  if (requiredField === 'productType') {
    return presentFields.has('productType') || presentFields.has('category');
  }

  return presentFields.has(requiredField);
}

export function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);

  return rows;
}

export function validateProductImport(content: string): ProductImportValidationResult {
  const csvRows = parseCsv(content);
  const [headerRow, ...dataRows] = csvRows;
  const errors: ProductImportError[] = [];
  const records: ProductImportRecord[] = [];

  if (!headerRow || dataRows.length === 0) {
    return {
      totalRows: 0,
      records,
      errors: [{ row: 1, field: 'file', message: 'CSV file is empty or has no data rows.' }],
    };
  }

  const headers = headerRow.map((header): ProductImportField | null => HEADER_ALIASES[normalizeHeader(header)] || null);
  const presentFields = new Set(headers.filter((field): field is ProductImportField => Boolean(field)));

  for (const requiredField of REQUIRED_FIELDS) {
    if (!hasRequiredField(presentFields, requiredField)) {
      errors.push({
        row: 1,
        field: requiredField,
        message: `Missing required column: ${requiredField}.`,
      });
    }
  }

  if (errors.length > 0) {
    return { totalRows: dataRows.length, records, errors };
  }

  dataRows.forEach((values, index) => {
    const rowNumber = index + 2;
    const raw: Record<string, string> = {};

    headers.forEach((fieldName, fieldIndex) => {
      if (fieldName) raw[fieldName] = values[fieldIndex] || '';
    });

    const productType = raw.productType || raw.category || '';
    const subType = raw.subType || raw.subcategory || '';
    const images = splitImageList(raw.images);
    const isAvailable = parseBoolean(raw.isAvailable, true);
    const isPriceVisible = parseBoolean(raw.isPriceVisible, true);
    const thc = parseOptionalPercent(raw.thc);
    const cbd = parseOptionalPercent(raw.cbd);

    if (isAvailable === null) {
      errors.push({ row: rowNumber, field: 'isAvailable', message: 'Use true/false, yes/no, or 1/0.' });
    }

    if (isPriceVisible === null) {
      errors.push({ row: rowNumber, field: 'isPriceVisible', message: 'Use true/false, yes/no, or 1/0.' });
    }

    if (!thc.valid) {
      errors.push({ row: rowNumber, field: 'thc', message: 'THC must be a number between 0 and 100.' });
    }

    if (!cbd.valid) {
      errors.push({ row: rowNumber, field: 'cbd', message: 'CBD must be a number between 0 and 100.' });
    }

    const parsed = parseProductPayload({
      name: raw.name,
      productType,
      subType,
      price: raw.price,
      inventoryQty: raw.inventoryQty,
      unit: raw.unit,
      description: raw.description,
      images,
      isAvailable: isAvailable ?? true,
      isPriceVisible: isPriceVisible ?? true,
      sku: raw.sku,
      brand: raw.brand,
      thcMin: thc.value,
      thcMax: thc.value,
      cbdMin: cbd.value,
      cbdMax: cbd.value,
    }, {
      partial: false,
      defaultStatus: PRODUCT_STATUS.PUBLISHED,
    });

    if (!parsed.ok) {
      for (const message of parsed.errors) {
        const field = message.split(' ')[0] || 'row';
        errors.push({ row: rowNumber, field, message });
      }
      return;
    }

    records.push({
      name: parsed.data.name || '',
      productType: parsed.data.productType,
      subType: parsed.data.subType,
      strainName: toOptionalString(raw.strain),
      price: parsed.data.price ?? 0,
      inventoryQty: parsed.data.inventoryQty ?? 0,
      unit: parsed.data.unit || 'Gram',
      description: parsed.data.description,
      images: parsed.data.images || [],
      isAvailable: parsed.data.isAvailable,
      isPriceVisible: parsed.data.isPriceVisible,
      sku: parsed.data.sku,
      brand: parsed.data.brand,
      thcMin: thc.value,
      thcMax: thc.value,
      cbdMin: cbd.value,
      cbdMax: cbd.value,
    });
  });

  return { totalRows: dataRows.length, records, errors };
}

export function productImportTemplateCsv() {
  return [
    ['name', 'productType', 'subType', 'strain', 'price', 'inventoryQty', 'unit', 'description', 'isAvailable', 'isPriceVisible', 'images', 'sku', 'brand', 'thc', 'cbd'].join(','),
    ['Blue Dream - 3.5g Jar', 'Flower', '3.5g Jar', 'Blue Dream', '45.00', '100', 'Gram', 'Premium sativa flower with berry aroma', 'true', 'true', 'https://example.com/image1.jpg', 'BD-001', 'PhenoShop', '22', '1'].map((value) => `"${value}"`).join(','),
  ].join('\n');
}
