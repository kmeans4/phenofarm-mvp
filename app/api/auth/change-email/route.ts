import { after, NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { accountMailConfigured } from '@/lib/account-mail';
import { accountBody, accountJson, accountRequestLimit } from '@/lib/account-security-api';
import { ACCOUNT_REQUEST_MESSAGE, normalizeAccountEmail, requestAccountLink, validAccountEmail } from '@/lib/account-security';

export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return accountJson({ error: 'Sign in to change your email.' }, 401);
    const body = await accountBody(request);
    const email = normalizeAccountEmail(body?.email);
    if (!body || !validAccountEmail(email) || typeof body.currentPassword !== 'string' || Buffer.byteLength(body.currentPassword, 'utf8') > 72) {
      return accountJson({ error: 'Enter a valid new email and your current password.' }, 400);
    }
    const limits = await accountRequestLimit(request, 'change-email', session.user.id);
    if (!limits.ipAllowed || !limits.identityAllowed) return accountJson({ error: 'Too many requests. Try again in an hour.' }, 429);
    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (!user?.emailVerifiedAt || user.sessionVersion !== session.user.sessionVersion) return accountJson({ error: 'Please sign in again.' }, 401);
    if (!user.passwordHash || !await bcrypt.compare(body.currentPassword, user.passwordHash)) return accountJson({ error: 'Current password is incorrect.' }, 400);
    if (email === user.email) return accountJson({ error: 'Enter a different email address.' }, 400);
    if (!accountMailConfigured()) return accountJson({ error: 'Email delivery is temporarily unavailable. Please try again later.' }, 503);
    after(() => requestAccountLink(email, 'CHANGE_EMAIL', user.id, user.sessionVersion));
    return accountJson({ success: true, message: ACCOUNT_REQUEST_MESSAGE });
  } catch {
    return accountJson({ error: 'Unable to request an email change. Please try again.' }, 503);
  }
}
