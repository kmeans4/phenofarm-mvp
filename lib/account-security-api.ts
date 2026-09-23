import { after, NextRequest, NextResponse } from 'next/server';
import { AccountActionPurpose } from '@prisma/client';
import { consumeAuthLimit, requestIp } from '@/lib/auth-rate-limit';
import { accountMailConfigured } from '@/lib/account-mail';
import { ACCOUNT_REQUEST_MESSAGE, INVALID_ACCOUNT_LINK, passwordRequirement, consumeAccountLink, hashAccountToken, normalizeAccountEmail, requestAccountLink, validAccountEmail, validAccountToken, validNewPassword } from '@/lib/account-security';

export const accountJson = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });

export async function accountBody(request: NextRequest): Promise<Record<string, unknown> | null> {
  const origin = request.headers.get('origin');
  if ((origin && origin !== request.nextUrl.origin) || request.headers.get('sec-fetch-site') === 'cross-site'
    || !request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return null;
  if (Number(request.headers.get('content-length') || 0) > 8192) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > 8192) { await reader.cancel(); return null; }
      chunks.push(value);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    return body && typeof body === 'object' && !Array.isArray(body) ? body : null;
  } catch { return null; }
}

export async function accountRequestLimit(request: NextRequest, scope: string, identity: string) {
  const [ipAllowed, identityAllowed] = await Promise.all([
    consumeAuthLimit(`${scope}-ip`, requestIp(Object.fromEntries(request.headers)), 20, 3600),
    consumeAuthLimit(`${scope}-identity`, identity, 4, 3600),
  ]);
  return { ipAllowed, identityAllowed };
}

export async function requestPublicAccountLink(request: NextRequest, purpose: 'VERIFY_EMAIL' | 'RESET_PASSWORD') {
  try {
    const body = await accountBody(request);
    const email = normalizeAccountEmail(body?.email);
    if (!body || !validAccountEmail(email)) return accountJson({ error: 'Enter a valid email address.' }, 400);
    const limits = await accountRequestLimit(request, purpose.toLowerCase(), email);
    if (!limits.ipAllowed) return accountJson({ error: 'Too many requests. Try again in an hour.' }, 429);
    if (!accountMailConfigured()) return accountJson({ error: 'Email delivery is temporarily unavailable. Please try again later.' }, 503);
    if (limits.identityAllowed) after(() => requestAccountLink(email, purpose));
    return accountJson({ success: true, message: ACCOUNT_REQUEST_MESSAGE });
  } catch {
    return accountJson({ error: 'Unable to process this request. Please try again.' }, 503);
  }
}

export async function completeAccountAction(request: NextRequest, purpose: AccountActionPurpose) {
  try {
    const body = await accountBody(request);
    if (!body || !validAccountToken(body.token)) return accountJson({ error: INVALID_ACCOUNT_LINK }, 400);
    const allowed = await Promise.all([
      consumeAuthLimit('account-confirm-ip', requestIp(Object.fromEntries(request.headers)), 40, 900),
      consumeAuthLimit('account-confirm-token', hashAccountToken(body.token), 8, 900),
    ]);
    if (allowed.some(value => !value)) return accountJson({ error: 'Too many attempts. Try again in 15 minutes.' }, 429);
    if (purpose === 'RESET_PASSWORD' && !validNewPassword(body.password)) return accountJson({ error: passwordRequirement(body.password) }, 400);
    if (purpose === 'VERIFY_EMAIL' && (typeof body.password !== 'string' || !body.password || Buffer.byteLength(body.password, 'utf8') > 72)) {
      return accountJson({ error: 'Enter the password for this account.' }, 400);
    }
    const done = await consumeAccountLink(body.token, purpose, typeof body.password === 'string' ? body.password : undefined);
    return done ? accountJson({ success: true }) : accountJson({ error: INVALID_ACCOUNT_LINK }, 400);
  } catch {
    return accountJson({ error: INVALID_ACCOUNT_LINK }, 400);
  }
}
