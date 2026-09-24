import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { CURRENT_POLICIES } from './current';

export async function currentAcceptance(userId: string) {
  return db.policyAcceptance.findUnique({ where: { userId_termsVersion_privacyVersion: {
    userId, termsVersion: CURRENT_POLICIES.termsVersion, privacyVersion: CURRENT_POLICIES.privacyVersion,
  } } });
}

export async function requirePolicyAcceptance(userId: string) {
  if (!await currentAcceptance(userId)) redirect('/account/terms');
}
