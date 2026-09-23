import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth-helpers';
import { AccountAccessCard } from '../components/AccountAccessCard';
import { AccountAccessForm } from '../components/AccountAccessForm';
export default async function ChangeEmailPage() {
  const session = await getAuthSession();
  if (!session) redirect('/auth/sign_in');
  return <AccountAccessCard title="Change your email" description="Confirm the new mailbox before your login changes. Your existing email stays active until then."><AccountAccessForm mode="change-email" currentEmail={session.user.email} /></AccountAccessCard>;
}
