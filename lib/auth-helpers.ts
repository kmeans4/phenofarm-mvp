import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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

export async function requireGrowerRole(): Promise<SessionUser> {
  const session = await requireAuth();
  
  if ((session as any).user.role !== 'GROWER') {
    redirect('/dashboard');
  }

  return (session as any).user;
}

export async function requireDispensaryRole(): Promise<SessionUser> {
  const session = await requireAuth();
  
  if ((session as any).user.role !== 'DISPENSARY') {
    redirect('/dashboard');
  }

  return (session as any).user;
}
