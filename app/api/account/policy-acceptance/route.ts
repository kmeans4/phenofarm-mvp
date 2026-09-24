import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import { accountBody, accountJson } from '@/lib/account-security-api';
import { CURRENT_POLICIES, validPolicyAcceptance } from '@/lib/policies/current';
import { logApiError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return accountJson({ error: 'Please sign in.' }, 401);
    const body = await accountBody(request);
    if (!body || !validPolicyAcceptance(body)) return accountJson({ error: 'Please agree to the current Terms and acknowledge the Privacy Policy. Refresh the page if the policies have changed.' }, 400);
    // Identity, versions, digests, and time are server controlled. A retry never
    // overwrites the original acceptance timestamp or creates another record.
    const acceptance = await db.policyAcceptance.upsert({
      where: { userId_termsVersion_privacyVersion: { userId: session.user.id, termsVersion: CURRENT_POLICIES.termsVersion, privacyVersion: CURRENT_POLICIES.privacyVersion } },
      create: { userId: session.user.id, ...CURRENT_POLICIES, source: 'account' }, update: {},
    });
    return accountJson({ acceptedAt: acceptance.acceptedAt, termsVersion: acceptance.termsVersion, privacyVersion: acceptance.privacyVersion });
  } catch (error) {
    logApiError('policy.acceptance', error);
    return accountJson({ error: 'Unable to save your agreement. Please try again.' }, 503);
  }
}
