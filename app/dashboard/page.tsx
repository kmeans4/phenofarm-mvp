import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as any;
  
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
