import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth-helpers';

interface SessionUser {
  role: string;
}

export default async function DashboardPage() {
  const session = await getAuthSession();
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as SessionUser;
  
  // Redirect to role-specific dashboard
  if (user.role === 'GROWER') {
    redirect('/grower/dashboard');
  } else if (user.role === 'DISPENSARY') {
    redirect('/dispensary/dashboard');
  } else if (user.role === 'ADMIN') {
    redirect('/admin');
  }
  
  // Fallback
  redirect('/grower/dashboard');
}
