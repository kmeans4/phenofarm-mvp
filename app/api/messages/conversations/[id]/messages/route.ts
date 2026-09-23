import { NextRequest, NextResponse } from 'next/server';
import { ConversationMessageType, OfferStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import { createNotification } from '@/lib/notifications';

function isOfferPayload(value: unknown): value is { quantity?: number; unitPrice?: number; note?: string } {
  return typeof value === 'object' && value !== null;
}

async function getAuthorizedConversation(conversationId: string) {
  const session = await getAuthSession();
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const user = session.user;
  const conversation = await db.conversation.findUnique({ where: { id: conversationId } });

  if (!conversation) {
    return { error: NextResponse.json({ error: 'Conversation not found' }, { status: 404 }) };
  }

  if (user.role === 'GROWER') {
    if (!user.growerId || conversation.growerId !== user.growerId) {
      return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
  } else if (user.role === 'DISPENSARY') {
    if (!user.dispensaryId || conversation.dispensaryId !== user.dispensaryId) {
      return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
  } else {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { user, conversation };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const auth = await getAuthorizedConversation(id);
    if ('error' in auth) return auth.error;

    const quoteCutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    await db.conversationMessage.updateMany({
      where: {
        conversationId: id,
        messageType: ConversationMessageType.OFFER,
        offerStatus: OfferStatus.PENDING,
        createdAt: { lt: quoteCutoff },
      },
      data: { offerStatus: OfferStatus.EXPIRED },
    });

    const afterValue = request.nextUrl.searchParams.get('after');
    const after = afterValue ? new Date(afterValue) : null;
    const afterId = request.nextUrl.searchParams.get('afterId') || '';
    if (after && !Number.isFinite(after.getTime())) return NextResponse.json({ error: 'Invalid message cursor' }, { status: 400 });
    const messages = await db.conversationMessage.findMany({
      where: { conversationId: id, ...(after ? { OR: [{ createdAt: { gt: after } }, { createdAt: after, id: { gt: afterId } }] } : {}) },
      include: { acceptedQuote: true },
      orderBy: [{ createdAt: after ? 'asc' : 'desc' }, { id: after ? 'asc' : 'desc' }],
      take: 300,
    });

    if (!after) messages.reverse();
    const senderIds = Array.from(new Set(messages.map((m) => m.senderUserId)));
    const productIds = Array.from(new Set(messages.map((m) => m.productId).filter(Boolean) as string[]));

    const [senders, products] = await Promise.all([
      db.user.findMany({
        where: { id: { in: senderIds } },
        select: { id: true, name: true, email: true, role: true },
      }),
      productIds.length > 0
        ? db.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, unit: true } })
        : Promise.resolve([]),
    ]);

    const senderMap = new Map(senders.map((sender) => [sender.id, sender]));
    const productMap = new Map(products.map((product) => [product.id, product]));

    const payload = messages.map((message) => ({
      id: message.id,
      conversationId: message.conversationId,
      senderUserId: message.senderUserId,
      sender: senderMap.get(message.senderUserId) || null,
      messageType: message.messageType,
      body: message.body,
      productId: message.productId,
      product: message.productId ? productMap.get(message.productId) || null : null,
      offerQuantity: message.offerQuantity,
      offerUnitPrice: message.offerUnitPrice ? Number(message.offerUnitPrice) : null,
      offerNote: message.offerNote,
      offerStatus: message.offerStatus,
      respondedToMessageId: message.respondedToMessageId,
      acceptedQuote: message.acceptedQuote ? {
        id: message.acceptedQuote.id,
        acceptedAt: message.acceptedQuote.acceptedAt,
        expiresAt: message.acceptedQuote.expiresAt,
        consumedByOrderId: message.acceptedQuote.consumedByOrderId,
      } : null,
      createdAt: message.createdAt,
    }));

    const offerUpdates = after ? await db.conversationMessage.findMany({
      where: { conversationId: id, messageType: ConversationMessageType.OFFER },
      orderBy: { createdAt: 'desc' }, take: 300,
      select: { id: true, offerStatus: true, acceptedQuote: { select: { id: true, acceptedAt: true, expiresAt: true, consumedByOrderId: true } } },
    }) : [];
    return NextResponse.json({ messages: payload, offerUpdates }, { status: 200 });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const auth = await getAuthorizedConversation(id);
    if ('error' in auth) return auth.error;

    const { user, conversation } = auth;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    if (body.messageType && !['TEXT', 'PRICING_REQUEST', 'OFFER'].includes(body.messageType)) return NextResponse.json({ error: 'Invalid message type' }, { status: 400 });
    if (typeof body.body === 'string' && body.body.length > 5000) return NextResponse.json({ error: 'Message exceeds 5000 characters' }, { status: 400 });
    const bodyText = typeof body.body === 'string' ? body.body.trim() : '';
    const requestedProductId = typeof body.productId === 'string' ? body.productId : conversation.productId;

    if (requestedProductId && !await db.product.findFirst({ where: { id: requestedProductId, growerId: conversation.growerId, isDeleted: false }, select: { id: true } })) return NextResponse.json({ error: 'Product does not belong to this grower' }, { status: 400 });
    const requestedType = body.messageType;
    const messageType =
      requestedType === ConversationMessageType.PRICING_REQUEST
        ? ConversationMessageType.PRICING_REQUEST
        : requestedType === ConversationMessageType.OFFER
          ? ConversationMessageType.OFFER
          : ConversationMessageType.TEXT;

    let offerQuantity: number | null = null;
    let offerUnitPrice: number | null = null;
    let offerNote: string | null = null;
    let messageBody = bodyText;

    if (messageType === ConversationMessageType.OFFER) {
      if (!isOfferPayload(body.offer)) {
        return NextResponse.json({ error: 'Quote payload is required for quote messages' }, { status: 400 });
      }

      const offer = body.offer as { quantity?: number; unitPrice?: number; note?: string };
      const quantity = Number(offer.quantity);
      const unitPrice = Number(offer.unitPrice);
      const note = typeof offer.note === 'string' ? offer.note.trim() : '';

      if (!Number.isFinite(unitPrice) || unitPrice <= 0 || unitPrice > 999999.99 || note.length > 5000) {
        return NextResponse.json({ error: 'Quote unit price must be greater than zero' }, { status: 400 });
      }

      if (offer.quantity !== undefined && offer.quantity !== null) {
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999) return NextResponse.json({ error: 'Quote quantity must be a whole number between 1 and 9999' }, { status: 400 });
        offerQuantity = quantity;
      }

      offerUnitPrice = Number(unitPrice.toFixed(2));
      offerNote = note || null;

      if (!messageBody) {
        messageBody = note || 'Quote terms';
      }
    }

    if (!messageBody) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 });
    }

    const message = await db.$transaction(async (tx) => {
      const created = await tx.conversationMessage.create({ data: {
        conversationId: conversation.id,
        senderUserId: user.id,
        messageType,
        body: messageBody,
        productId: requestedProductId || null,
        offerQuantity,
        offerUnitPrice,
        offerNote,
        offerStatus: messageType === ConversationMessageType.OFFER ? OfferStatus.PENDING : null,
      } });

      await tx.conversation.update({
        where: { id: conversation.id },
        data: {
        lastMessageAt: created.createdAt,
        ...(user.role === 'GROWER'
          ? { growerLastReadAt: created.createdAt }
          : { dispensaryLastReadAt: created.createdAt }),
        },
      });

      if (messageType === ConversationMessageType.OFFER) {
        const recipient = user.role === 'GROWER'
          ? await tx.dispensary.findUnique({ where: { id: conversation.dispensaryId }, select: { userId: true } })
          : await tx.grower.findUnique({ where: { id: conversation.growerId }, select: { userId: true } });
        await createNotification(tx, {
          userId: recipient?.userId,
          conversationId: conversation.id, productId: requestedProductId,
          type: 'QUOTE_SENT',
          title: 'New quote',
          body: 'New quote terms are waiting for your review in Messages.',
          href: user.role === 'GROWER' ? '/dispensary/dashboard' : '/grower/dashboard',
        });
      }

      return created;
    });

    return NextResponse.json(
      {
        id: message.id,
        conversationId: message.conversationId,
        senderUserId: message.senderUserId,
        messageType: message.messageType,
        body: message.body,
        productId: message.productId,
        offerQuantity: message.offerQuantity,
        offerUnitPrice: message.offerUnitPrice ? Number(message.offerUnitPrice) : null,
        offerNote: message.offerNote,
        offerStatus: message.offerStatus,
        createdAt: message.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
