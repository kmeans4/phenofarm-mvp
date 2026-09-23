import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

type NotificationClient = Prisma.TransactionClient | typeof db;

export interface NotificationInput {
  userId?: string | null;
  type: string;
  title: string;
  body: string;
  href: string;
  conversationId?: string;
  productId?: string | null;
}

export async function createNotification(client: NotificationClient, input: NotificationInput) {
  if (!input.userId) return null;
  let body = input.body;
  if (input.conversationId) {
    const conversation = await client.conversation.findUnique({
      where: { id: input.conversationId },
      select: { growerId: true, productId: true, grower: { select: { businessName: true, userId: true } }, dispensary: { select: { businessName: true, userId: true } } },
    });
    if (conversation && [conversation.grower.userId, conversation.dispensary.userId].includes(input.userId)) {
      const counterpart = conversation.grower.userId === input.userId ? conversation.dispensary : conversation.grower;
      const productId = input.productId || conversation.productId;
      const product = productId ? await client.product.findFirst({ where: { id: productId, growerId: conversation.growerId }, select: { name: true } }) : null;
      body = `${counterpart.businessName}${product ? ` · ${product.name}` : ''}`;
    }
  }
  return client.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body,
      href: input.href,
    },
  });
}

export async function ensureWeeklyLicenseExpiryNotification({
  userId,
  expiry,
  settingsHref,
}: {
  userId: string;
  expiry: Date | null;
  settingsHref: string;
}) {
  if (!expiry) return;
  const now = new Date();
  const remaining = expiry.getTime() - now.getTime();
  if (remaining > 30 * 24 * 60 * 60 * 1000) return;

  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const existing = await db.notification.findFirst({
    where: {
      userId,
      type: 'LICENSE_EXPIRY',
      createdAt: { gte: weekAgo },
    },
    select: { id: true },
  });
  if (existing) return;

  await createNotification(db, {
    userId,
    type: 'LICENSE_EXPIRY',
    title: remaining < 0 ? 'License expired' : 'License expires soon',
    body: remaining < 0
      ? 'Update your license details to restore marketplace access.'
      : 'Your license expires within 30 days. Update it before access is interrupted.',
    href: settingsHref,
  });
}
