import { AccountAccessCard } from '../components/AccountAccessCard';
import { AccountAccessForm } from '../components/AccountAccessForm';
export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ confirm?: string; sent?: string }> }) {
  const params = await searchParams;
  const confirm = params.confirm === '1';
  return <AccountAccessCard title={confirm ? 'Verify your email' : 'Check your email'} description={confirm ? 'Enter your account password to verify this email address.' : 'Verify your email to sign in. Your business license is reviewed separately.'}>
    <AccountAccessForm mode={confirm ? 'verify' : 'request-verification'} sent={params.sent === '1'} />
  </AccountAccessCard>;
}
