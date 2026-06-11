import { NextRequest, NextResponse } from 'next/server';
import { ConversationMessageType, OfferStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';

type OfferAction = 'ACCEPT' | 'REJECT' | 'COUNTER';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user;
    if (user.role !== 'GROWER' && user.role !== 'DISPENSARY') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();

    const action = typeof body.action === 'string' ? (body.action.toUpperCase() as OfferAction) : null;

    if (!action || !['ACCEPT', 'REJECT', 'COUNTER'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const message = await db.conversationMessage.findUnique({
      where: { id },
      include: { conversation: true },
    });

    if (!message) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    if (message.messageType !== ConversationMessageType.OFFER) {
      return NextResponse.json({ error: 'Message is not a quote' }, { status: 400 });
    }
    if (message.offerStatus !== OfferStatus.PENDING) {
      return NextResponse.json({ error: 'Quote is no longer pending' }, { status: 409 });
    }

    const conversation = message.conversation;

    if (user.role === 'GROWER') {
      if (!user.growerId || conversation.growerId !== user.growerId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      if (!user.dispensaryId || conversation.dispensaryId !== user.dispensaryId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (message.senderUserId === user.id) {
      return NextResponse.json({ error: 'You cannot respond to your own quote' }, { status: 400 });
    }

    const now = new Date();

    if (action === 'ACCEPT' || action === 'REJECT') {
      const status = action === 'ACCEPT' ? OfferStatus.ACCEPTED : OfferStatus.REJECTED;

      const [updatedOffer] = await db.$transaction([
        db.conversationMessage.update({
          where: { id: message.id },
          data: { offerStatus: status },
        }),
        db.conversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: now,
            ...(user.role === 'GROWER' ? { growerLastReadAt: now } : { dispensaryLastReadAt: now }),
          },
        }),
      ]);

      return NextResponse.json(
        {
          ok: true,
          action,
          messageId: updatedOffer.id,
          offerStatus: updatedOffer.offerStatus,
        },
        { status: 200 }
      );
    }

    // COUNTER action
    const counter = body.counter || {};
    const counterUnitPrice = Number(counter.unitPrice);
    const counterQuantity = Number(counter.quantity);
    const counterNote = typeof counter.note === 'string' ? counter.note.trim() : '';

    if (!Number.isFinite(counterUnitPrice) || counterUnitPrice <= 0) {
      return NextResponse.json({ error: 'Counter quote unit price must be greater than zero' }, { status: 400 });
    }

    const normalizedQuantity = Number.isFinite(counterQuantity) && counterQuantity > 0
      ? Math.floor(counterQuantity)
      : message.offerQuantity || null;

    const counterMessageBody = counterNote || 'Counter quote';

    const result = await db.$transaction(async (tx) => {
      const updatedOriginal = await tx.conversationMessage.update({
        where: { id: message.id },
        data: { offerStatus: OfferStatus.COUNTERED },
      });

      const newOffer = await tx.conversationMessage.create({
        data: {
          conversationId: conversation.id,
          senderUserId: user.id,
          messageType: ConversationMessageType.OFFER,
          body: counterMessageBody,
          productId: message.productId,
          offerQuantity: normalizedQuantity,
          offerUnitPrice: Number(counterUnitPrice.toFixed(2)),
          offerNote: counterNote || null,
          offerStatus: OfferStatus.PENDING,
          respondedToMessageId: message.id,
        },
      });

      await tx.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: newOffer.createdAt,
          ...(user.role === 'GROWER'
            ? { growerLastReadAt: newOffer.createdAt }
            : { dispensaryLastReadAt: newOffer.createdAt }),
        },
      });

      return { updatedOriginal, newOffer };
    });

    return NextResponse.json(
      {
        ok: true,
        action,
        updatedMessageId: result.updatedOriginal.id,
        counterOfferId: result.newOffer.id,
        counterOfferStatus: result.newOffer.offerStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error handling quote action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
