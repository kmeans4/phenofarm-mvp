import type { Prisma } from '@prisma/client';

// Licenses contain a calendar date. Keep that date valid through the end of the
// day in Vermont, regardless of the server or browser's timezone.
export function startOfLicenseDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)!.value;
  return new Date(`${value('year')}-${value('month')}-${value('day')}T00:00:00.000Z`);
}

export function isLicenseExpired(expiry: Date | string | null | undefined, now = new Date()) {
  if (!expiry) return false;
  const date = expiry instanceof Date ? expiry : new Date(expiry);
  return Number.isNaN(date.getTime()) || date.getTime() < startOfLicenseDay(now).getTime();
}

export function formatLicenseExpiry(expiry: Date | string) {
  const date = expiry instanceof Date ? expiry : new Date(expiry);
  return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', timeZone: 'UTC' });
}

export function marketplaceGrowerWhere(now = new Date()): Prisma.GrowerWhereInput {
  return {
    isVerified: true,
    OR: [
      { licenseExpiry: null },
      { licenseExpiry: { gte: startOfLicenseDay(now) } },
    ],
  };
}

export function getLicenseWindow(expiry: Date | null, now = new Date()) {
  if (!expiry) return 'none' as const;
  const remaining = expiry.getTime() - startOfLicenseDay(now).getTime();
  if (remaining < 0) return 'expired' as const;
  if (remaining <= 30 * 24 * 60 * 60 * 1000) return 'expiring' as const;
  return 'current' as const;
}
