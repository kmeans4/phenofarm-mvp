import { AccountAccessCard } from '../components/AccountAccessCard';
import { AccountAccessForm } from '../components/AccountAccessForm';
export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ confirm?: string; sent?: string }> }) {
  const params = await searchParams;
  const confirm = params.confirm === '1';
  return <AccountAccessCard title={confirm ? 'Verify your email' : 'Check your email'} description={confirm ? 'Confirm your mailbox and account password to finish verification.' : 'All accounts need a verified email before sign-in. Verification is separate from business license approval.'}>
    <AccountAccessForm mode={confirm ? 'verify' : 'request-verification'} sent={params.sent === '1'} />
  </AccountAccessCard>;
}
