import { cache } from 'react';
import { getServerSession, type Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

export type TypedSession = Session;
export type SessionUser = Session['user'];

// React memoizes only within a server render/request, never between users.
export const getAuthSession = cache(async (): Promise<Session | null> => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session;
});

export async function requireGrower() {
  const session = await getAuthSession();
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (session.user.role !== 'GROWER' || !session.user.growerId) {
    return { error: NextResponse.json({ error: 'Grower profile required' }, { status: 403 }) };
  }
  return { session, growerId: session.user.growerId };
}

export async function requireAuth(): Promise<Session> {
  const session = await getAuthSession();
  if (!session) redirect('/auth/sign_in');
  return session;
}

export const requireAdmin = cache(async () => {
  const session = await requireAuth();
  if (session.user.role !== 'ADMIN') redirect('/dashboard');
  return session;
});
