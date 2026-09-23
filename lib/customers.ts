import type { Prisma } from '@prisma/client';
export function customerWhere(growerId: string): Prisma.DispensaryWhereInput {
  return { OR: [
    { createdByGrowerId: growerId },
    { orders: { some: { growerId } } },
    { conversations: { some: { growerId } } },
  ] };
}
export const customerSelect = {
  id: true, businessName: true, contactName: true, phone: true, address: true,
  city: true, state: true, zip: true, website: true, description: true,
  licenseNumber: true, licenseExpiry: true, licenseStatus: true,
  userId: true, isOffPlatform: true, offPlatformEmail: true, createdByGrowerId: true,
  user: { select: { email: true, name: true } },
} satisfies Prisma.DispensarySelect;
