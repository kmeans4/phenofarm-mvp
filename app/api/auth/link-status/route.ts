import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { accountBody, accountJson } from '@/lib/account-security-api';
import { hashAccountToken, validAccountToken } from '@/lib/account-security';
import { consumeAuthLimit, requestIp } from '@/lib/auth-rate-limit';

export async function POST(request: NextRequest) {
  const body = await accountBody(request);
  if (
    !body ||
    !validAccountToken(body.token) ||
    !['VERIFY_EMAIL', 'RESET_PASSWORD', 'CHANGE_EMAIL'].includes(
      String(body.purpose)
    )
  )
    return accountJson({ valid: false }, 400);
  if (
    !(await consumeAuthLimit(
      'link-status',
      requestIp(Object.fromEntries(request.headers)),
      40,
      900
    ))
  )
    return accountJson(
      { error: 'Too many attempts. Try again in 15 minutes.' },
      429
    );
  const token = await db.accountActionToken.findUnique({
    where: { tokenHash: hashAccountToken(body.token) },
    include: { user: true },
  });
  const valid = Boolean(
    token &&
      token.purpose === body.purpose &&
      !token.consumedAt &&
      token.expiresAt > new Date() &&
      token.sessionVersion === token.user.sessionVersion &&
      !token.user.suspendedAt &&
      (token.purpose === 'CHANGE_EMAIL' || token.email === token.user.email)
  );
  if (!valid || !token) return accountJson({ valid: false });
  const proof = request.cookies.get('phenoshop-signup-proof')?.value;
  return accountJson({
    valid: true,
    needsNewPassword:
      token.purpose === 'VERIFY_EMAIL' &&
      (!proof || token.user.signupProofHash !== hashAccountToken(proof)),
  });
}
