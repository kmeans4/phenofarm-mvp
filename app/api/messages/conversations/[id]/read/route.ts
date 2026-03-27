import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user;
    const { id } = await context.params;

    const conversation = await db.conversation.findUnique({ where: { id } });
    if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    const now = new Date();

    if (user.role === 'GROWER') {
      if (!user.growerId || conversation.growerId !== user.growerId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      await db.conversation.update({
        where: { id },
        data: { growerLastReadAt: now },
      });
    } else if (user.role === 'DISPENSARY') {
      if (!user.dispensaryId || conversation.dispensaryId !== user.dispensaryId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      await db.conversation.update({
        where: { id },
        data: { dispensaryLastReadAt: now },
      });
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
