import { db } from '@/lib/db';
import { cache } from 'react';
import { unreadMessageCounts } from '@/lib/message-counts';
import { getOrderStatusLabel } from '@/lib/order-workflow';

export type GrowerAttentionType = 'request' | 'message' | 'cancellation' | 'status';
export type GrowerAttentionTone = 'yellow' | 'blue' | 'green' | 'red';

export interface GrowerAttentionItem {
  id: string;
  type: GrowerAttentionType;
  title: string;
  detail: string;
  href: string;
  createdAt: string;
  priority: number;
  tone: GrowerAttentionTone;
  badge: string;
  conversationId?: string;
}

export interface GrowerAttentionSummary {
  counts: {
    pendingRequests: number;
    unreadBuyerMessages: number;
    recentCancellations: number;
    recentStatusChanges: number;
    totalAttention: number;
    requestAttention: number;
  };
  items: GrowerAttentionItem[];
}

interface GrowerAttentionInput {
  growerId: string;
  userId: string;
  now?: Date;
}

const RECENT_CHANGE_DAYS = 7;

function toIso(value: Date) {
  return value.toISOString();
}

export function getGrowerAttentionSummary({ growerId, userId, now }: GrowerAttentionInput) {
  // Primitive keys let layout and page reuse one read within the RSC request.
  // React cache is request-scoped; no user's authorization is cached across requests.
  return readGrowerAttentionSummary(growerId, userId, now?.getTime());
}

const readGrowerAttentionSummary = cache(async (
  growerId: string, userId: string, now?: number,
): Promise<GrowerAttentionSummary> => {
  const recentSince = new Date(now ?? Date.now());
  recentSince.setDate(recentSince.getDate() - RECENT_CHANGE_DAYS);

  const [
    pendingRequests,
    pendingRequestsCount,
    recentCancellations,
    recentCancellationCount,
    recentStatusChanges,
    recentStatusChangeCount,
    conversations,
  ] = await Promise.all([
    db.order.findMany({
      where: { growerId, status: 'PENDING' },
      select: {
        id: true,
        orderId: true,
        totalAmount: true,
        createdAt: true,
        dispensary: { select: { businessName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    db.order.count({ where: { growerId, status: 'PENDING' } }),
    db.order.findMany({
      where: { growerId, status: 'CANCELLED', updatedAt: { gte: recentSince } },
      select: {
        id: true,
        orderId: true,
        updatedAt: true,
        dispensary: { select: { businessName: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 4,
    }),
    db.order.count({ where: { growerId, status: 'CANCELLED', updatedAt: { gte: recentSince } } }),
    db.order.findMany({
      where: {
        growerId,
        status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        updatedAt: { gte: recentSince },
      },
      select: {
        id: true,
        orderId: true,
        status: true,
        updatedAt: true,
        dispensary: { select: { businessName: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 4,
    }),
    db.order.count({
      where: {
        growerId,
        status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        updatedAt: { gte: recentSince },
      },
    }),
    db.conversation.findMany({
      where: { growerId },
      select: {
        id: true,
        growerLastReadAt: true,
        lastMessageAt: true,
        dispensary: { select: { businessName: true } },
        messages: {
          where: { senderUserId: { not: userId } },
          select: { body: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
    }),
  ]);

  const unreadMap = await unreadMessageCounts(userId, conversations.map(conversation => ({
    id: conversation.id, lastReadAt: conversation.growerLastReadAt,
  })));
  const unreadBuyerMessages = [...unreadMap.values()].reduce((sum, count) => sum + count, 0);

  const messageItems = conversations
    .reduce<GrowerAttentionItem[]>((items, conversation) => {
      const unreadCount = unreadMap.get(conversation.id) || 0;
      const latestMessage = conversation.messages[0];
      if (unreadCount === 0 || !latestMessage) return items;

      items.push({
        id: `message-${conversation.id}`,
        type: 'message',
        title: `${unreadCount} unread buyer message${unreadCount === 1 ? '' : 's'}`,
        detail: `${conversation.dispensary.businessName}: ${latestMessage.body}`,
        href: '/grower/dashboard',
        createdAt: toIso(latestMessage.createdAt),
        priority: 1,
        tone: 'blue',
        badge: 'Messages',
        conversationId: conversation.id,
      });

      return items;
    }, [])
    .slice(0, 4);

  const requestItems: GrowerAttentionItem[] = pendingRequests.map((order) => ({
    id: `request-${order.id}`,
    type: 'request',
    title: 'New buyer request',
    detail: `${order.dispensary.businessName} submitted ${order.orderId} for $${Number(order.totalAmount).toFixed(2)}.`,
    href: `/grower/orders/${order.id}`,
    createdAt: toIso(order.createdAt),
    priority: 0,
    tone: 'yellow',
    badge: 'Review',
  }));

  const cancellationItems: GrowerAttentionItem[] = recentCancellations.map((order) => ({
    id: `cancelled-${order.id}`,
    type: 'cancellation',
    title: 'Request cancelled',
    detail: `${order.dispensary.businessName} has ${order.orderId} marked cancelled.`,
    href: `/grower/orders/${order.id}`,
    createdAt: toIso(order.updatedAt),
    priority: 2,
    tone: 'red',
    badge: 'Cancelled',
  }));

  const statusItems: GrowerAttentionItem[] = recentStatusChanges.map((order) => ({
    id: `status-${order.id}`,
    type: 'status',
    title: `Recently ${getOrderStatusLabel(order.status).toLowerCase()}`,
    detail: `${order.orderId} for ${order.dispensary.businessName} moved to ${getOrderStatusLabel(order.status)}.`,
    href: `/grower/orders/${order.id}`,
    createdAt: toIso(order.updatedAt),
    priority: 3,
    tone: order.status === 'DELIVERED' ? 'green' : 'blue',
    badge: getOrderStatusLabel(order.status),
  }));

  const items = [...requestItems, ...messageItems, ...cancellationItems, ...statusItems]
    .sort((a, b) => a.priority - b.priority || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  const requestAttention = pendingRequestsCount + recentCancellationCount;

  return {
    counts: {
      pendingRequests: pendingRequestsCount,
      unreadBuyerMessages,
      recentCancellations: recentCancellationCount,
      recentStatusChanges: recentStatusChangeCount,
      requestAttention,
      totalAttention: requestAttention + unreadBuyerMessages + recentStatusChangeCount,
    },
    items,
  };
});
