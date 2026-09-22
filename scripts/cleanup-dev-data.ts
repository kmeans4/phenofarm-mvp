import { PrismaClient } from '@prisma/client';
import { loadRolloutEnvironment, parseRolloutArgs, targetSummary } from './db-rollout-guard';

const deadTables = ['sessions', 'payments', 'carts', 'cart_items'] as const;
let db: PrismaClient | undefined;

async function tableCount(table: (typeof deadTables)[number]) {
  const exists = await db!.$queryRawUnsafe<Array<{ exists: string | null }>>(
    `SELECT to_regclass('public.${table}')::text AS exists`,
  );
  if (!exists[0]?.exists) return null;
  const rows = await db!.$queryRawUnsafe<Array<{ count: bigint }>>(`SELECT COUNT(*)::bigint AS count FROM "${table}"`);
  return Number(rows[0].count);
}

async function main() {
  const options = parseRolloutArgs(process.argv.slice(2), {
    mutating: true,
    requireLocalConfirmation: true,
  });
  if (options.target !== 'local') {
    throw new Error('This development cleanup is local-only. Use a rehearsal database explicitly; production cleanup is not supported.');
  }
  const environment = loadRolloutEnvironment(options);
  db = new PrismaClient();

  const before = Object.fromEntries(
    await Promise.all(deadTables.map(async (table) => [table, await tableCount(table)] as const)),
  );
  console.log('Dead-table counts before cleanup:');
  console.log(JSON.stringify(before, null, 2));

  const automatedConversationIds = await db.$queryRawUnsafe<Array<{ conversationId: string }>>(
    `SELECT DISTINCT "conversationId" FROM conversation_messages WHERE body LIKE 'Automated %'`,
  );
  const automatedMessages = await db.$executeRawUnsafe(
    `DELETE FROM conversation_messages WHERE body LIKE 'Automated %'`,
  );

  let emptiedConversations = 0;
  if (automatedConversationIds.length) {
    emptiedConversations = await db.$executeRawUnsafe(
      `DELETE FROM conversations
       WHERE id = ANY($1::text[])
         AND NOT EXISTS (SELECT 1 FROM conversation_messages message WHERE message."conversationId" = conversations.id)`,
      automatedConversationIds.map((row) => row.conversationId),
    );
  }

  const oldReadNotifications = await db.$executeRawUnsafe(
    `DELETE FROM notifications WHERE "readAt" IS NOT NULL AND "createdAt" < NOW() - INTERVAL '90 days'`,
  );

  const deletedDeadRows: Record<string, number | null> = {};
  for (const table of ['cart_items', 'carts', 'payments', 'sessions'] as const) {
    const count = await tableCount(table);
    deletedDeadRows[table] = count === null ? null : await db.$executeRawUnsafe(`DELETE FROM "${table}"`);
  }

  console.log(JSON.stringify({ ...targetSummary(environment), automatedMessages, emptiedConversations, oldReadNotifications, deletedDeadRows }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (db) await db.$disconnect();
  });
