import { Prisma, type OrderStatus } from '@prisma/client';

export class OrderConflictError extends Error {
  constructor() {
    super('This order changed. Refresh it before trying again.');
  }
}

// Transaction-local marker lets the database reject writers from older deployments.
export async function beginOrderMutation(tx: Prisma.TransactionClient) {
  await tx.$queryRaw`SELECT set_config('phenoshop.inventory_writer', 'acceptance-v1', true)`;
}

export async function claimOrder(
  tx: Prisma.TransactionClient,
  order: { id: string; status: OrderStatus; updatedAt: Date }
) {
  await beginOrderMutation(tx);
  const result = await tx.order.updateMany({
    where: { id: order.id, status: order.status, updatedAt: order.updatedAt },
    data: {
      updatedAt: new Date(Math.max(Date.now(), order.updatedAt.getTime() + 1)),
    },
  });
  if (result.count !== 1) throw new OrderConflictError();
}

export async function restoreInventory(
  tx: Prisma.TransactionClient,
  productId: string,
  quantity: number
) {
  // Restore visibility only for an exhausted published listing; preserve manual hiding of stocked items.
  await tx.product.updateMany({
    where: {
      id: productId,
      inventoryQty: 0,
      status: 'PUBLISHED',
      isDeleted: false,
    },
    data: { isAvailable: true },
  });
  await tx.product.updateMany({
    where: { id: productId },
    data: { inventoryQty: { increment: quantity } },
  });
}

export class OrderInventoryError extends Error {
  constructor(
    message: string,
    public code: 'INSUFFICIENT_INVENTORY' | 'LEGACY_INVENTORY_REVIEW_REQUIRED',
    public issues: {
      productId: string;
      productName: string;
      requested: number;
      available: number;
    }[] = []
  ) {
    super(message);
  }
}

type InventoryOrder = {
  id: string;
  growerId: string;
  inventoryState: import('@prisma/client').OrderInventoryState;
};
type InventoryLine = { productId: string; quantity: number };

export function assertInventoryReviewed(order: InventoryOrder) {
  if (order.inventoryState === 'LEGACY_UNREVIEWED') {
    throw new OrderInventoryError(
      'This older order needs an inventory review before it can be changed. Contact support to reconcile its previous stock deduction.',
      'LEGACY_INVENTORY_REVIEW_REQUIRED'
    );
  }
}

// Every path locks orders before products, and products in the same global order.
export async function lockInventoryProducts(
  tx: Prisma.TransactionClient,
  ids: string[]
) {
  if (!ids.length) return;
  await tx.$queryRaw(
    Prisma.sql`SELECT id FROM products WHERE id IN (${Prisma.join([...new Set(ids)].sort())}) ORDER BY id FOR UPDATE`
  );
}

function quantities(items: InventoryLine[]) {
  const result = new Map<string, number>();
  for (const item of items) {
    result.set(
      item.productId,
      (result.get(item.productId) || 0) + item.quantity
    );
  }
  return result;
}

/** Caller must claim/lock the order in this same transaction before reading/editing its items. */
export async function syncOrderInventory(
  tx: Prisma.TransactionClient,
  order: InventoryOrder,
  previousItems: InventoryLine[],
  finalItems: InventoryLine[],
  targetStatus: OrderStatus
) {
  assertInventoryReviewed(order);
  const shouldDeduct =
    targetStatus !== 'PENDING' && targetStatus !== 'CANCELLED';
  const before = quantities(
    order.inventoryState === 'DEDUCTED' ? previousItems : []
  );
  const after = quantities(shouldDeduct ? finalItems : []);
  const ids = [...new Set([...before.keys(), ...after.keys()])].sort();
  await lockInventoryProducts(tx, ids);
  for (const productId of ids) {
    const delta = (after.get(productId) || 0) - (before.get(productId) || 0);
    if (delta > 0) {
      // The guarded decrement is the final authority even after the row lock.
      const result = await tx.product.updateMany({
        where: {
          id: productId,
          growerId: order.growerId,
          isDeleted: false,
          inventoryQty: { gte: delta },
        },
        data: { inventoryQty: { decrement: delta } },
      });
      if (result.count !== 1) {
        const product = await tx.product.findFirst({
          where: { id: productId, growerId: order.growerId },
          select: { name: true, inventoryQty: true },
        });
        throw new OrderInventoryError(
          `Not enough stock for ${product?.name || 'a product'}: ${delta} additional units needed, ${product?.inventoryQty || 0} available. Adjust the quantities or update stock, then try again. No changes were saved.`,
          'INSUFFICIENT_INVENTORY',
          [
            {
              productId,
              productName: product?.name || 'Unavailable product',
              requested: delta,
              available: product?.inventoryQty || 0,
            },
          ]
        );
      }
      await tx.product.updateMany({
        where: { id: productId, inventoryQty: 0 },
        data: { isAvailable: false },
      });
    } else if (delta < 0) {
      await restoreInventory(tx, productId, -delta);
    }
  }
  await tx.order.update({
    where: { id: order.id },
    data: { inventoryState: shouldDeduct ? 'DEDUCTED' : 'NOT_DEDUCTED' },
  });
}

/** Explicit operator-reviewed legacy accounting; never infer a deduction from order status. */
export async function reconcileLegacyOrder(
  tx: Prisma.TransactionClient,
  review: { id: string; expectedUpdatedAt: string; stockWasDeducted: boolean }
) {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: review.id },
    include: { items: true },
  });
  if (
    order.inventoryState !== 'LEGACY_UNREVIEWED' ||
    order.updatedAt.toISOString() !== review.expectedUpdatedAt
  )
    throw new OrderConflictError();
  const accepted = order.status !== 'PENDING' && order.status !== 'CANCELLED';
  if (accepted && !review.stockWasDeducted)
    throw new Error(
      'An accepted legacy order without a verified deduction needs separate stock reconciliation. No changes were saved.'
    );
  if (order.status === 'CANCELLED' && review.stockWasDeducted)
    throw new Error(
      'A cancelled legacy order with an outstanding deduction needs separate stock reconciliation. No changes were saved.'
    );
  await claimOrder(tx, order);
  if (order.status === 'PENDING' && review.stockWasDeducted) {
    await lockInventoryProducts(
      tx,
      order.items.map((item) => item.productId)
    );
    for (const [productId, quantity] of quantities(order.items))
      await restoreInventory(tx, productId, quantity);
  }
  await tx.orderStatusEvent.create({
    data: {
      orderId: order.id,
      fromStatus: order.status,
      toStatus: order.status,
      actorRole: 'ADMIN',
      note: `Legacy inventory review: outstanding deduction ${review.stockWasDeducted ? 'verified' : 'absent'}.${order.status === 'PENDING' && review.stockWasDeducted ? ' Released pending quantities.' : ' Stock unchanged.'}`,
    },
  });
  return tx.order.update({
    where: { id: order.id },
    data: {
      inventoryState: accepted ? 'DEDUCTED' : 'NOT_DEDUCTED',
      updatedAt: new Date(Math.max(Date.now(), order.updatedAt.getTime() + 1)),
    },
  });
}
