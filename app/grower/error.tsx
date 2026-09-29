'use client';
import Link from 'next/link';
import { ErrorState } from '@/app/components/ui/FetchState';
export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <>
      <ErrorState
        title="This page couldn't be loaded"
        description="Your saved work is still there. Try again."
        onRetry={retry}
      />
      <Link
        className="mt-4 inline-flex min-h-11 items-center text-pf-accent"
        href="/grower/dashboard"
      >
        Back to overview
      </Link>
    </>
  );
}
