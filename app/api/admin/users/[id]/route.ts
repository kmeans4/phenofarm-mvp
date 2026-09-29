import { after, NextRequest } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { accountBody, accountJson } from '@/lib/account-security-api';
import { requestAccountLink } from '@/lib/account-security';
import { accountMailConfigured } from '@/lib/account-mail';
import { consumeAuthLimit } from '@/lib/auth-rate-limit';
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (session?.user.role !== 'ADMIN')
    return accountJson({ error: 'Admin access required.' }, 403);
  const body = await accountBody(request);
  const { id } = await params;
  const action = body?.action;
  if (
    ![
      'reset-password',
      'resend-verification',
      'suspend',
      'resume',
      'sign-out',
    ].includes(String(action))
  )
    return accountJson({ error: 'Choose an account action.' }, 400);
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      role: true,
      emailVerifiedAt: true,
      suspendedAt: true,
    },
  });
  if (!user) return accountJson({ error: 'Account not found.' }, 404);
  if (
    (action === 'suspend' || action === 'sign-out') &&
    (id === session.user.id || user.role === 'ADMIN')
  )
    return accountJson(
      { error: 'This action is unavailable for administrator accounts.' },
      409
    );
  if (
    !(await consumeAuthLimit(
      'admin-account-action',
      `${id}:${action}`,
      5,
      3600
    ))
  )
    return accountJson(
      { error: 'Too many requests for this account. Try again later.' },
      429
    );
  if (action === 'reset-password' || action === 'resend-verification') {
    if (!accountMailConfigured())
      return accountJson(
        {
          error:
            'Email delivery is temporarily unavailable. Please try again later.',
        },
        503
      );
    if (user.suspendedAt)
      return accountJson(
        { error: 'Resume this account before sending an access link.' },
        409
      );
    if (action === 'resend-verification' && user.emailVerifiedAt)
      return accountJson({ error: 'This email is already verified.' }, 409);
    after(() =>
      requestAccountLink(
        user.email,
        action === 'reset-password' ? 'RESET_PASSWORD' : 'VERIFY_EMAIL'
      )
    );
    return accountJson({
      success: true,
      message:
        'Email requested. The account owner can use the link in their inbox.',
    });
  }
  await db.user.update({
    where: { id },
    data: {
      sessionVersion: { increment: 1 },
      ...(action === 'suspend'
        ? { suspendedAt: new Date() }
        : action === 'resume'
          ? { suspendedAt: null }
          : {}),
    },
  });
  return accountJson({
    success: true,
    message:
      action === 'suspend'
        ? 'Account paused and sessions ended.'
        : action === 'resume'
          ? 'Account resumed.'
          : 'All account sessions ended.',
  });
}
