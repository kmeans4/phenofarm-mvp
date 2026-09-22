import { after, NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { consumeAuthLimit, requestIp } from '@/lib/auth-rate-limit';
import { accountMailConfigured } from '@/lib/account-mail';
import { emailVerificationRequired } from '@/lib/auth-rollout.cjs';
import { accountBody, accountJson } from '@/lib/account-security-api';
import { ACCOUNT_REQUEST_MESSAGE, passwordRequirement, normalizeAccountEmail, requestAccountLink, validAccountEmail, validNewPassword } from '@/lib/account-security';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Keep public account creation closed while existing pilot accounts migrate.
    if (!emailVerificationRequired()) return accountJson({ error: 'Sign-up is temporarily unavailable. Please try again later.' }, 503);
    const body = await accountBody(request);
    if (!body) return accountJson({ error: 'Invalid sign-up request.' }, 400);
    const email = normalizeAccountEmail(body.email);
    const password = body.password;
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
    const businessName = typeof body.businessName === 'string' ? body.businessName.trim() : '';
    const businessType = body.businessType === 'dispensary' ? 'dispensary' : body.businessType === 'grower' ? 'grower' : null;
    const name = [firstName, lastName].filter(Boolean).join(' ') || businessName;
    const resolvedBusinessName = businessName || name;
    if (!validAccountEmail(email)) return accountJson({ error: 'A valid email address is required.' }, 400);
    if (!validNewPassword(password)) return accountJson({ error: passwordRequirement(password) }, 400);
    if (!businessType) return accountJson({ error: 'Choose grower or dispensary.' }, 400);
    if (!resolvedBusinessName || resolvedBusinessName.length > 200 || name.length > 200) return accountJson({ error: 'Business name or contact name is required (up to 200 characters).' }, 400);
    const [ipAllowed, emailAllowed] = await Promise.all([
      consumeAuthLimit('register-ip', requestIp(Object.fromEntries(request.headers)), 10, 3600),
      consumeAuthLimit('register-email', email, 4, 3600),
    ]);
    if (!ipAllowed || !emailAllowed) return accountJson({ error: 'Too many sign-up attempts. Try again in an hour.' }, 429);
    if (!accountMailConfigured()) return accountJson({ error: 'Email delivery is temporarily unavailable. Please try again later.' }, 503);
    // Complete durable account/profile creation before acknowledging success.
    // Hash on both paths and keep the same response for existing addresses.
    const passwordHash = await bcrypt.hash(password, 10);
    try {
      await db.$transaction(async tx => {
        const user = await tx.user.create({ data: { email, name, passwordHash, role: businessType === 'grower' ? 'GROWER' : 'DISPENSARY' } });
        if (businessType === 'grower') {
          const profile = await tx.grower.create({ data: { userId: user.id, businessName: resolvedBusinessName, contactName: name } });
          await tx.user.update({ where: { id: user.id }, data: { growerId: profile.id } });
        } else {
          const profile = await tx.dispensary.create({ data: { userId: user.id, businessName: resolvedBusinessName, contactName: name } });
          await tx.user.update({ where: { id: user.id }, data: { dispensaryId: profile.id } });
        }
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002'
        || !await db.user.findUnique({ where: { email }, select: { id: true } })) throw error;
      // A concurrent or existing account is never overwritten.
    }
    // Only delivery is deferred. A failed delivery can be retried through resend.
    after(async () => {
      try { await requestAccountLink(email, 'VERIFY_EMAIL'); }
      catch { console.error('[account-registration]', { code: 'VERIFICATION_DELIVERY_FAILED' }); }
    });
    return accountJson({ success: true, message: ACCOUNT_REQUEST_MESSAGE }, 201);
  } catch {
    return accountJson({ error: 'Unable to process sign-up. Please try again.' }, 503);
  }
}
