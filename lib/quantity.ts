/** Quantities are stored as exact decimal selling units, to three decimal places. */
export function isWeightUnit(unit: unknown, productType?: unknown) {
  if (String(productType).toLowerCase().replace(/[-\s]/g, '') === 'preroll')
    return false;
  return /^(g|grams?|oz|ounces?|lb|lbs|pounds?)$/i.test(
    String(unit || '').trim()
  );
}

export function quantityMinimum(unit: unknown, productType?: unknown) {
  return isWeightUnit(unit, productType) ? 0.001 : 1;
}

export function quantityIncrement(unit: unknown, productType?: unknown) {
  if (!isWeightUnit(unit, productType)) return 1;
  return /^(lb|lbs|pounds?)$/i.test(String(unit))
    ? 0.25
    : /^(oz|ounces?)$/i.test(String(unit))
      ? 0.5
      : 1;
}

export function roundQuantity(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function validQuantity(
  value: unknown,
  options: {
    unit?: unknown;
    productType?: unknown;
    allowZero?: boolean;
    max?: number;
    allowUnknownUnit?: boolean;
  } = {}
) {
  const n = Number(value);
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    typeof value === 'boolean' ||
    !Number.isFinite(n)
  )
    return false;
  if (n < (options.allowZero ? 0 : 0.001) || n > (options.max ?? 999999))
    return false;
  if (Math.abs(n * 1000 - Math.round(n * 1000)) > 0.0000001) return false;
  return (
    (options.allowUnknownUnit && !options.unit) ||
    isWeightUnit(options.unit, options.productType) ||
    Number.isInteger(n)
  );
}

export const QUANTITY_MESSAGE =
  'Use up to 3 decimal places for weights, and whole quantities for packs and pieces.';

/** Round each monetary line once, using integer cents and thousandths of a selling unit. */
export function quantityPrice(quantity: number, unitPrice: number) {
  if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return 0;
  const milli = BigInt(Math.round(quantity * 1000));
  const cents = BigInt(Math.round(unitPrice * 100));
  return Number((milli * cents + BigInt(500)) / BigInt(1000)) / 100;
}
