import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import { ConversationMessageType, Prisma } from '@prisma/client';

function requireMessagingUser(session: Awaited<ReturnType<typeof getAuthSession>>) {
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const user = session.user;
  if (user.role !== 'GROWER' && user.role !== 'DISPENSARY') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  if (user.role === 'GROWER' && !user.growerId) {
    return { error: NextResponse.json({ error: 'Grower account missing' }, { status: 400 }) };
  }

  if (user.role === 'DISPENSARY' && !user.dispensaryId) {
    return { error: NextResponse.json({ error: 'Dispensary account missing' }, { status: 400 }) };
  }

  return { user };
}

function buildOfferSummary(message: { offerQuantity: number | null; offerUnitPrice: Prisma.Decimal | string | number | null }) {
  const unitPrice = Number(message.offerUnitPrice || 0);
  const qty = message.offerQuantity || 0;
  if (qty > 0 && unitPrice > 0) return `Quote: ${qty} @ $${unitPrice.toFixed(2)}`;
  if (unitPrice > 0) return `Quote: $${unitPrice.toFixed(2)}`;
  return 'Quote sent';
}

export async function GET() {
  try {
    const auth = requireMessagingUser(await getAuthSession());
    if ('error' in auth) return auth.error;
    const user = auth.user;

    const isGrower = user.role === 'GROWER';

    const conversations = await db.conversation.findMany({
      where: isGrower ? { growerId: user.growerId } : { dispensaryId: user.dispensaryId },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            body: true,
            messageType: true,
            offerQuantity: true,
            offerUnitPrice: true,
            createdAt: true,
            senderUserId: true,
          },
        },
      },
      take: 100,
    });

    const growerIds = new Set<string>();
    const dispensaryIds = new Set<string>();
    const productIds = new Set<string>();

    conversations.forEach((conversation) => {
      if (conversation.productId) productIds.add(conversation.productId);
      growerIds.add(conversation.growerId);
      dispensaryIds.add(conversation.dispensaryId);
    });

    const [growers, dispensaries, products] = await Promise.all([
      db.grower.findMany({
        where: { id: { in: Array.from(growerIds) } },
        select: { id: true, businessName: true },
      }),
      db.dispensary.findMany({
        where: { id: { in: Array.from(dispensaryIds) } },
        select: { id: true, businessName: true },
      }),
      db.product.findMany({
        where: { id: { in: Array.from(productIds) } },
        select: { id: true, name: true, unit: true },
      }),
    ]);

    const growerMap = new Map(growers.map((g) => [g.id, g]));
    const dispensaryMap = new Map(dispensaries.map((d) => [d.id, d]));
    const productMap = new Map(products.map((p) => [p.id, p]));

    const unreadCounts = conversations.length ? await db.conversationMessage.groupBy({
      by: ['conversationId'],
      where: { senderUserId: { not: user.id }, OR: conversations.map(conversation => {
        const lastReadAt = isGrower ? conversation.growerLastReadAt : conversation.dispensaryLastReadAt;
        return { conversationId: conversation.id, ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}) };
      }) },
      _count: { _all: true },
    }) : [];
    const unreadMap = new Map(unreadCounts.map(entry => [entry.conversationId, entry._count._all]));

    const payload = conversations.map((conversation) => {
      const lastMessage = conversation.messages[0] || null;
      const counterpart = isGrower
        ? dispensaryMap.get(conversation.dispensaryId)
        : growerMap.get(conversation.growerId);

      const preview = !lastMessage
        ? 'Start the conversation'
        : lastMessage.messageType === ConversationMessageType.OFFER
          ? buildOfferSummary(lastMessage)
          : lastMessage.body;

      return {
        id: conversation.id,
        growerId: conversation.growerId,
        dispensaryId: conversation.dispensaryId,
        productId: conversation.productId,
        product: conversation.productId ? productMap.get(conversation.productId) || null : null,
        lastMessageAt: conversation.lastMessageAt,
        unreadCount: unreadMap.get(conversation.id) || 0,
        lastMessagePreview: preview,
        counterpart: {
          id: isGrower ? conversation.dispensaryId : conversation.growerId,
          name: counterpart?.businessName || 'Unknown',
          role: isGrower ? 'DISPENSARY' : 'GROWER',
        },
      };
    });

    return NextResponse.json({ conversations: payload }, { status: 200 });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireMessagingUser(await getAuthSession());
    if ('error' in auth) return auth.error;
    const user = auth.user;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    if (body.messageType && !['TEXT', 'PRICING_REQUEST'].includes(body.messageType)) return NextResponse.json({ error: 'Invalid message type' }, { status: 400 });
    if (typeof body.body === 'string' && body.body.length > 5000) return NextResponse.json({ error: 'Message exceeds 5000 characters' }, { status: 400 });
    const messageBody = typeof body.body === 'string' ? body.body.trim() : '';
    const messageType = body.messageType === ConversationMessageType.PRICING_REQUEST
      ? ConversationMessageType.PRICING_REQUEST
      : ConversationMessageType.TEXT;

    let growerId: string | null = null;
    let dispensaryId: string | null = null;

    if (user.role === 'DISPENSARY') {
      growerId = typeof body.growerId === 'string' ? body.growerId : null;
      dispensaryId = user.dispensaryId || null;
    } else {
      growerId = user.growerId || null;
      dispensaryId = typeof body.dispensaryId === 'string' ? body.dispensaryId : null;
    }

    if (!growerId || !dispensaryId) {
      return NextResponse.json({ error: 'Missing grower/dispensary context' }, { status: 400 });
    }

    const [grower, dispensary] = await Promise.all([
      db.grower.findUnique({ where: { id: growerId }, select: { id: true } }),
      db.dispensary.findUnique({ where: { id: dispensaryId }, select: { id: true } }),
    ]);

    if (!grower || !dispensary) {
      return NextResponse.json({ error: 'Invalid conversation participants' }, { status: 404 });
    }

    const requestedProductId = typeof body.productId === 'string' ? body.productId : null;
    let productId: string | null = null;

    if (requestedProductId) {
      const product = await db.product.findFirst({
        where: {
          id: requestedProductId,
          growerId,
          isDeleted: false,
        },
        select: { id: true },
      });

      if (!product) {
        return NextResponse.json({ error: 'Product not found for this grower' }, { status: 404 });
      }
      productId = product.id;
    }

    const result = await db.$transaction(async tx => {
      // Serialize creation by participant/context even when productId is null.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${growerId}:${dispensaryId}:${productId || ''}`}, 0))`;
    const now = new Date();
    const existing = await tx.conversation.findFirst({
      where: {
        growerId,
        dispensaryId,
        ...(productId ? { productId } : { productId: null }),
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const conversation = existing
      ? await tx.conversation.update({
          where: { id: existing.id },
          data: {
            ...(user.role === 'GROWER' ? { growerLastReadAt: now } : { dispensaryLastReadAt: now }),
            updatedAt: now,
          },
        })
      : await tx.conversation.create({
          data: {
            growerId,
            dispensaryId,
            productId,
            createdByUserId: user.id,
            growerLastReadAt: user.role === 'GROWER' ? now : null,
            dispensaryLastReadAt: user.role === 'DISPENSARY' ? now : null,
            lastMessageAt: now,
          },
        });

    let createdMessage = null;

    if (messageBody) {
      createdMessage = await tx.conversationMessage.create({
        data: {
          conversationId: conversation.id,
          senderUserId: user.id,
          messageType,
          body: messageBody,
          productId: productId || conversation.productId || null,
        },
      });

      await tx.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: createdMessage.createdAt,
          ...(user.role === 'GROWER'
            ? { growerLastReadAt: createdMessage.createdAt }
            : { dispensaryLastReadAt: createdMessage.createdAt }),
        },
      });
    }

      return { conversationId: conversation.id, messageId: createdMessage?.id || null, existed: Boolean(existing) };
    });
    return NextResponse.json(
      {
        conversationId: result.conversationId,
        messageId: result.messageId,
      },
      { status: result.existed ? 200 : 201 }
    );
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
