import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth-helpers';
import { AccountAccessCard } from '../components/AccountAccessCard';
import { AccountAccessForm } from '../components/AccountAccessForm';
export default async function ChangeEmailPage() {
  const session = await getAuthSession();
  if (!session) redirect('/auth/sign_in');
  return <AccountAccessCard title="Change your email" description="We will email a confirmation link to your new address. Keep signing in with your current email until you confirm the change."><AccountAccessForm mode="change-email" currentEmail={session.user.email} /></AccountAccessCard>;
}
