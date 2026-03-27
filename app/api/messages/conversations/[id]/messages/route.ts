import { NextRequest, NextResponse } from 'next/server';
import { ConversationMessageType, OfferStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';

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
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const auth = await getAuthorizedConversation(id);
    if ('error' in auth) return auth.error;

    const messages = await db.conversationMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      take: 300,
    });

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
      createdAt: message.createdAt,
    }));

    return NextResponse.json({ messages: payload }, { status: 200 });
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

    const body = await request.json();
    const bodyText = typeof body.body === 'string' ? body.body.trim() : '';
    const requestedProductId = typeof body.productId === 'string' ? body.productId : conversation.productId;

    const requestedType = body.messageType;
    const messageType =
      requestedType === ConversationMessageType.PRICING_REQUEST
        ? ConversationMessageType.PRICING_REQUEST
        : requestedType === ConversationMessageType.OFFER
          ? ConversationMessageType.OFFER
          : requestedType === ConversationMessageType.SYSTEM
            ? ConversationMessageType.SYSTEM
            : ConversationMessageType.TEXT;

    let offerQuantity: number | null = null;
    let offerUnitPrice: number | null = null;
    let offerNote: string | null = null;
    let messageBody = bodyText;

    if (messageType === ConversationMessageType.OFFER) {
      if (!isOfferPayload(body.offer)) {
        return NextResponse.json({ error: 'Offer payload is required for offer messages' }, { status: 400 });
      }

      const offer = body.offer as { quantity?: number; unitPrice?: number; note?: string };
      const quantity = Number(offer.quantity);
      const unitPrice = Number(offer.unitPrice);
      const note = typeof offer.note === 'string' ? offer.note.trim() : '';

      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        return NextResponse.json({ error: 'Offer unit price must be greater than zero' }, { status: 400 });
      }

      if (Number.isFinite(quantity) && quantity > 0) {
        offerQuantity = Math.floor(quantity);
      }

      offerUnitPrice = Number(unitPrice.toFixed(2));
      offerNote = note || null;

      if (!messageBody) {
        messageBody = note || 'Pricing offer';
      }
    }

    if (!messageBody) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 });
    }

    const message = await db.conversationMessage.create({
      data: {
        conversationId: conversation.id,
        senderUserId: user.id,
        messageType,
        body: messageBody,
        productId: requestedProductId || null,
        offerQuantity,
        offerUnitPrice,
        offerNote,
        offerStatus: messageType === ConversationMessageType.OFFER ? OfferStatus.PENDING : null,
      },
    });

    await db.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: message.createdAt,
        ...(user.role === 'GROWER'
          ? { growerLastReadAt: message.createdAt }
          : { dispensaryLastReadAt: message.createdAt }),
      },
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
