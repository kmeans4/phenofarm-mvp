/** Local rehearsal only. Production reconciliation requires a separately approved runbook. */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { reconcileLegacyOrder } from '../lib/order-mutations';

async function main() {
  const url = new URL(process.env.DATABASE_URL || '');
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
    throw new Error(
      'This rehearsal command refuses non-local databases. Production approval and a reviewed reconciliation plan are required.'
    );
  const args = process.argv.slice(2);
  if (
    args.some((arg) => !['--apply'].includes(arg) && !arg.endsWith('.json')) ||
    args.filter((arg) => arg.endsWith('.json')).length !== 1
  )
    throw new Error(
      'Usage: reconcile-order-inventory.ts reviewed-manifest.json [--apply]. Default: read-only dry run.'
    );
  const manifest: unknown = JSON.parse(
    readFileSync(args.find((arg) => arg.endsWith('.json'))!, 'utf8')
  );
  if (
    !Array.isArray(manifest) ||
    !manifest.length ||
    manifest.some(
      (row) =>
        !row ||
        typeof row.id !== 'string' ||
        typeof row.expectedUpdatedAt !== 'string' ||
        typeof row.stockWasDeducted !== 'boolean'
    ) ||
    new Set(manifest.map((row) => row.id)).size !== manifest.length
  )
    throw new Error(
      'Each unique reviewed row requires id, expectedUpdatedAt and stockWasDeducted.'
    );
  const db = new PrismaClient();
  try {
    for (const review of manifest) {
      const order = await db.order.findUniqueOrThrow({
        where: { id: review.id },
        include: { items: { select: { productId: true, quantity: true } } },
      });
      if (
        order.inventoryState !== 'LEGACY_UNREVIEWED' ||
        order.updatedAt.toISOString() !== review.expectedUpdatedAt
      )
        throw new Error(
          `Review is stale or already applied for ${order.id}. Refresh the reviewed manifest.`
        );
      if (
        (order.status === 'CANCELLED' && review.stockWasDeducted) ||
        (!['PENDING', 'CANCELLED'].includes(order.status) &&
          !review.stockWasDeducted)
      )
        throw new Error(
          `Order ${order.id} needs separate stock reconciliation. No changes were saved.`
        );
      console.log(
        JSON.stringify({
          id: order.id,
          status: order.status,
          inventoryState: order.inventoryState,
          updatedAt: order.updatedAt,
          reviewedStockWasDeducted: review.stockWasDeducted,
          releasePendingDeduction:
            order.status === 'PENDING' && review.stockWasDeducted,
          items: order.items,
        })
      );
    }
    if (args.includes('--apply')) {
      // Entire reviewed manifest rolls back if any order is stale or inconsistent.
      await db.$transaction(
        async (tx) => {
          for (const review of [...manifest].sort((a, b) =>
            a.id.localeCompare(b.id)
          ))
            await reconcileLegacyOrder(tx, review);
        },
        { timeout: 30000 }
      );
      console.log('Reviewed local orders reconciled.');
    } else console.log('Dry run only; no database changes.');
  } finally {
    await db.$disconnect();
  }
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : 'Reconciliation failed'
  );
  process.exitCode = 1;
});
