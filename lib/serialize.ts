import { Prisma } from '@prisma/client';

type Plain<T> = T extends Prisma.Decimal
  ? number
  : T extends Date
    ? Date
    : T extends Array<infer V>
      ? Plain<V>[]
      : T extends object
        ? { [K in keyof T]: Plain<T[K]> }
        : T;

/** Convert database decimals at API/client boundaries; keep exact arithmetic in transactions. */
export function plainData<T>(value: T): Plain<T> {
  if (Prisma.Decimal.isDecimal(value)) return value.toNumber() as Plain<T>;
  if (value instanceof Date || value === null || typeof value !== 'object')
    return value as Plain<T>;
  if (Array.isArray(value)) return value.map(plainData) as Plain<T>;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, plainData(item)])
  ) as Plain<T>;
}
