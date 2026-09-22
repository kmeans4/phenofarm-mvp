import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user;
    const { id } = await context.params;
    const conversation = await db.conversation.findUnique({ where: { id }, select: { growerId: true, dispensaryId: true } });
    if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    const isGrower = user.role === 'GROWER' && Boolean(user.growerId) && conversation.growerId === user.growerId;
    const isDispensary = user.role === 'DISPENSARY' && Boolean(user.dispensaryId) && conversation.dispensaryId === user.dispensaryId;
    if (!isGrower && !isDispensary) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await request.json().catch(() => null);
    const throughMessageId = body?.throughMessageId;
    if (typeof throughMessageId !== 'string' || !throughMessageId || throughMessageId.length > 100) {
      return NextResponse.json({ error: 'The last displayed incoming message is required' }, { status: 400 });
    }
    const result = await db.$transaction(async tx => {
      const message = await tx.conversationMessage.findFirst({
        where: { id: throughMessageId, conversationId: id, senderUserId: { not: user.id } },
        select: { createdAt: true },
      });
      if (!message) return null;
      // A timestamp-only read marker must not acknowledge unseen messages in the
      // same millisecond. Their next cursor response will allow the cutoff to advance.
      const unseenAtSameTime = await tx.conversationMessage.count({
        where: { conversationId: id, senderUserId: { not: user.id }, createdAt: message.createdAt, id: { gt: throughMessageId } },
      });
      const cutoff = new Date(message.createdAt.getTime() - (unseenAtSameTime ? 1 : 0));
      const readField = isGrower ? 'growerLastReadAt' : 'dispensaryLastReadAt';
      await tx.conversation.updateMany({
        where: { id, OR: [{ [readField]: null }, { [readField]: { lt: cutoff } }] },
        data: { [readField]: cutoff },
      });
      const saved = await tx.conversation.findUniqueOrThrow({ where: { id }, select: { growerLastReadAt: true, dispensaryLastReadAt: true } });
      const readAt = saved[readField];
      const unreadCount = await tx.conversationMessage.count({
        where: { conversationId: id, senderUserId: { not: user.id }, ...(readAt ? { createdAt: { gt: readAt } } : {}) },
      });
      return { ok: true, throughMessageId, unreadCount };
    });
    return result ? NextResponse.json(result) : NextResponse.json({ error: 'Message not found in this conversation' }, { status: 404 });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    return NextResponse.json({ error: 'Unable to update the read state' }, { status: 503 });
  }
}
