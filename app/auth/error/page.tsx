import Link from 'next/link';
import { AccountAccessCard } from '../components/AccountAccessCard';
import { SignOutButton } from '@/app/components/SignOutButton';
export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const configuration = error === 'Configuration';
  return (
    <AccountAccessCard
      title={
        configuration ? 'Account setup isn’t finished' : 'Could not sign in'
      }
      description={
        configuration
          ? 'Contact support so we can finish your business profile.'
          : 'Check your email and password, or request a new access link.'
      }
    >
      <div className="space-y-3">
        <Link
          className="flex min-h-11 items-center justify-center rounded-lg bg-emerald-500 px-4 text-pf-canvas"
          href="/auth/sign_in"
        >
          Back to sign in
        </Link>
        <Link
          className="flex min-h-11 items-center justify-center text-pf-accent underline"
          href="/contact"
        >
          Contact support
        </Link>
        {configuration && <SignOutButton />}
      </div>
    </AccountAccessCard>
  );
}
