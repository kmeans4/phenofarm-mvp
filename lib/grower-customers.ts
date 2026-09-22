import { db } from '@/lib/db';
import { customerWhere } from '@/lib/customers';
import { parsePage } from '@/lib/buyer-products';
import type { Prisma } from '@prisma/client';

export async function getGrowerCustomerPage(growerId: string, params: { page?: string; search?: string }) {
  const search = params.search?.trim().slice(0, 160) || '';
  const pageSize = 25;
  const scope = customerWhere(growerId);
  const where: Prisma.DispensaryWhereInput = { AND: [scope, ...(search ? [{ OR: [
    { businessName: { contains: search, mode: 'insensitive' as const } },
    { contactName: { contains: search, mode: 'insensitive' as const } },
    { city: { contains: search, mode: 'insensitive' as const } },
    { offPlatformEmail: { contains: search, mode: 'insensitive' as const } },
    { user: { email: { contains: search, mode: 'insensitive' as const } } },
  ] }] : [])] };
  const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const [customerCount, matchedCount, totalCustomerOrders, orderedInLast90Days] = await Promise.all([
    db.dispensary.count({ where: scope }),
    search ? db.dispensary.count({ where }) : Promise.resolve(null),
    db.order.count({ where: { growerId } }),
    db.dispensary.count({ where: { orders: { some: { growerId, createdAt: { gte: ninetyDaysAgo } } } } }),
  ]);
  const total = matchedCount ?? customerCount;
  const page = Math.min(parsePage(params.page ?? null), Math.max(1, Math.ceil(total / pageSize)));
  const customers = await db.dispensary.findMany({
    where, take: pageSize, skip: (page - 1) * pageSize, orderBy: [{ businessName: 'asc' }, { id: 'asc' }],
    select: { id: true, businessName: true, licenseNumber: true, phone: true, city: true, state: true, userId: true, createdByGrowerId: true, offPlatformEmail: true, contactName: true, user: { select: { email: true, name: true } } },
  });
  const ids = customers.map(customer => customer.id);
  const [stats, deliveredStats] = ids.length ? await Promise.all([
    db.order.groupBy({ by: ['dispensaryId'], where: { growerId, dispensaryId: { in: ids } }, _count: { _all: true }, _max: { createdAt: true } }),
    db.order.groupBy({ by: ['dispensaryId'], where: { growerId, dispensaryId: { in: ids }, status: 'DELIVERED' }, _sum: { totalAmount: true } }),
  ]) : [[], []];
  return { customers, stats, deliveredStats, page, pageSize, total, search, customerCount, totalCustomerOrders, orderedInLast90Days };
}
