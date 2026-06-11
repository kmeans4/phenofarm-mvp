import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export interface SessionUser {
  id: string;
  role: string;
  growerId?: string;
  dispensaryId?: string;
  email: string;
}

export interface TypedSession {
  user: SessionUser;
  expires: string;
}

export async function getAuthSession(): Promise<TypedSession | null> {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return session as unknown as TypedSession;
}

export async function requireAuth(): Promise<TypedSession> {
  const session = await getAuthSession();
  if (!session) {
    redirect('/auth/sign_in');
  }
  return session;
}
