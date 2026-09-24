import { requireAuth } from '@/lib/auth-helpers';
import { currentAcceptance } from '@/lib/policies/server';
import { redirect } from 'next/navigation';
import { AcceptanceForm } from './AcceptanceForm';

export default async function PolicyAcceptancePage() {
  const session = await requireAuth();
  if (await currentAcceptance(session.user.id)) redirect('/dashboard');
  return <AcceptanceForm />;
}
