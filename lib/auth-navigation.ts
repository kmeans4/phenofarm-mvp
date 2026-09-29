import { headers } from 'next/headers';
import { safeInternalPath } from '@/app/components/ui/safeNavigation';

export async function requestedPage() {
  return safeInternalPath(
    (await headers()).get('x-phenoshop-page'),
    '/dashboard'
  );
}

export async function signInDestination() {
  return `/auth/sign_in?callbackUrl=${encodeURIComponent(await requestedPage())}`;
}
