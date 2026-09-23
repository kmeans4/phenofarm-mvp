import type { Prisma, OrderStatus } from '@prisma/client';

export class OrderConflictError extends Error {
  constructor() { super('This order changed. Refresh it before trying again.'); }
}

export async function claimOrder(tx: Prisma.TransactionClient, order: { id: string; status: OrderStatus; updatedAt: Date }) {
  const result = await tx.order.updateMany({
    where: { id: order.id, status: order.status, updatedAt: order.updatedAt },
    data: { updatedAt: new Date(Math.max(Date.now(), order.updatedAt.getTime() + 1)) },
  });
  if (result.count !== 1) throw new OrderConflictError();
}

export async function restoreInventory(tx: Prisma.TransactionClient, productId: string, quantity: number) {
  // Restore visibility only for an exhausted published listing; preserve manual hiding of stocked items.
  await tx.product.updateMany({
    where: { id: productId, inventoryQty: 0, status: 'PUBLISHED', isDeleted: false },
    data: { isAvailable: true },
  });
  await tx.product.updateMany({ where: { id: productId }, data: { inventoryQty: { increment: quantity } } });
}
