import { safeInternalPath } from '@/app/components/ui/safeNavigation';
import { requireAuth } from '@/lib/auth-helpers';
import { currentAcceptance } from '@/lib/policies/server';
import { redirect } from 'next/navigation';
import { AcceptanceForm } from './AcceptanceForm';

export default async function PolicyAcceptancePage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await requireAuth();
  if (await currentAcceptance(session.user.id))
    redirect(safeInternalPath((await searchParams).callbackUrl, '/dashboard'));
  return <AcceptanceForm />;
}
