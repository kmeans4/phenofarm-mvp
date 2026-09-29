import { getAuthSession } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
export const metadata = { title: 'Create account | PhenoShop' };
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (await getAuthSession()) redirect('/dashboard');
  return children;
}
