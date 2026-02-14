import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

interface SessionUser {
  role: string;
  growerId?: string;
  dispensaryId?: string;
  id?: string;
  email?: string;
}

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  return session;
}

export async function requireGrowerRole() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as SessionUser;
  
  if (user.role !== 'GROWER') {
    redirect('/dashboard');
  }

  return user;
}

export async function requireDispensaryRole() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as SessionUser;
  
  if (user.role !== 'DISPENSARY') {
    redirect('/dashboard');
  }

  return user;
}
