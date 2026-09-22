import { db } from '@/lib/db';

// Callers supply only conversation IDs they have already authorized.
export async function unreadMessageCounts(userId: string, conversations: { id: string; lastReadAt: Date | null }[]) {
  if (!conversations.length) return new Map<string, number>();
  const rows = await db.conversationMessage.groupBy({
    by: ['conversationId'],
    where: {
      senderUserId: { not: userId },
      OR: conversations.map(conversation => ({
        conversationId: conversation.id,
        ...(conversation.lastReadAt ? { createdAt: { gt: conversation.lastReadAt } } : {}),
      })),
    },
    _count: { _all: true },
  });
  return new Map(rows.map(row => [row.conversationId, row._count._all]));
}
