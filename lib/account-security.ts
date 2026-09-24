import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { AccountActionPurpose } from '@prisma/client';
import { db } from '@/lib/db';
import { accountOrigin, sendAccountMail } from '@/lib/account-mail';

export const ACCOUNT_REQUEST_MESSAGE = 'If this address is eligible, an email will arrive shortly. Check your spam folder or try again later.';
export const INVALID_ACCOUNT_LINK = 'This link is invalid or has expired. Request a new email and try again.';
export const passwordRequirement = (value: unknown) => typeof value === 'string' && Buffer.byteLength(value, 'utf8') > 72
  ? 'Password is too long. Use fewer characters.' : 'Use at least 12 characters.';
export const normalizeAccountEmail = (value: unknown) => typeof value === 'string' ? value.trim().toLowerCase() : '';
export const validAccountEmail = (email: string) => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const validNewPassword = (value: unknown): value is string => typeof value === 'string' && value.length >= 12 && Buffer.byteLength(value, 'utf8') <= 72;
export const hashAccountToken = (value: string) => createHash('sha256').update(value).digest('hex');
export const validAccountToken = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);

const expiryMinutes: Record<AccountActionPurpose, number> = { VERIFY_EMAIL: 60, RESET_PASSWORD: 30, CHANGE_EMAIL: 30 };
const path: Record<AccountActionPurpose, string> = {
  VERIFY_EMAIL: '/auth/verify-email?confirm=1', RESET_PASSWORD: '/auth/reset-password', CHANGE_EMAIL: '/auth/confirm-email-change',
};
const action: Record<AccountActionPurpose, string> = {
  VERIFY_EMAIL: 'Verify your email', RESET_PASSWORD: 'Reset your password', CHANGE_EMAIL: 'Confirm your new email',
};

// Called only after a generic HTTP response. Account lookup and delivery cannot reveal existence through response timing.
export async function requestAccountLink(email: string, purpose: AccountActionPurpose, userId?: string, authorizedVersion?: number) {
  let tokenId: string | undefined;
  try {
    const raw = randomBytes(32).toString('base64url');
    const token = await db.$transaction(async (tx) => {
      const account = userId
        ? await tx.user.findUnique({ where: { id: userId } })
        : await tx.user.findUnique({ where: { email } });
      if (!account || !account.passwordHash) return null;
      await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${account.id} FOR UPDATE`;
      const current = await tx.user.findUniqueOrThrow({ where: { id: account.id } });
      if (purpose !== 'CHANGE_EMAIL' && current.email !== email) return null;
      if (purpose === 'VERIFY_EMAIL' && current.emailVerifiedAt) return null;
      if (purpose === 'CHANGE_EMAIL' && (current.sessionVersion !== authorizedVersion || !current.emailVerifiedAt || current.email === email || await tx.user.findUnique({ where: { email }, select: { id: true } }))) return null;
      return tx.accountActionToken.create({ data: {
        tokenHash: hashAccountToken(raw), userId: current.id, purpose, email, sessionVersion: current.sessionVersion,
        expiresAt: new Date(Date.now() + expiryMinutes[purpose] * 60_000),
      } });
    });
    if (!token) return;
    tokenId = token.id;
    const url = `${accountOrigin()}${path[purpose]}#token=${raw}`;
    await sendAccountMail({ to: token.email, subject: `${action[purpose]} — PhenoShop`, text:
      `${action[purpose]}\n\nOpen this link to continue:\n${url}\n\nThis link expires in ${expiryMinutes[purpose]} minutes and works once. ${purpose === 'VERIFY_EMAIL' ? 'You will also need the password you chose for this account. ' : ''}If you did not request this, ignore this email. Do not share the link.\n\nPhenoShop` });
    await db.accountActionToken.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 86_400_000) } } });
  } catch {
    if (tokenId) await db.accountActionToken.deleteMany({ where: { id: tokenId, consumedAt: null } }).catch(() => undefined);
    console.error('[account-mail]', { code: 'DELIVERY_FAILED', purpose });
  }
}

export async function consumeAccountLink(raw: string, purpose: AccountActionPurpose, password?: string) {
  if (!validAccountToken(raw) || (purpose === 'RESET_PASSWORD' && !validNewPassword(password))) return false;
  const tokenHash = hashAccountToken(raw);
  const newHash = purpose === 'RESET_PASSWORD' && password ? await bcrypt.hash(password, 10) : undefined;
  return db.$transaction(async (tx) => {
    const candidate = await tx.accountActionToken.findUnique({ where: { tokenHash }, select: { userId: true } });
    if (!candidate) return false;
    // One row lock serializes every purpose for this account, including password-reset/email-change races.
    await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${candidate.userId} FOR UPDATE`;
    const token = await tx.accountActionToken.findUnique({ where: { tokenHash } });
    const user = await tx.user.findUnique({ where: { id: candidate.userId } });
    const now = new Date();
    if (!token || !user || token.purpose !== purpose || token.consumedAt || token.expiresAt <= now || token.sessionVersion !== user.sessionVersion) return false;
    if (purpose !== 'CHANGE_EMAIL' && token.email !== user.email) return false;
    if (purpose === 'VERIFY_EMAIL' && (!password || !user.passwordHash || !await bcrypt.compare(password, user.passwordHash))) return false;
    if (purpose === 'RESET_PASSWORD' && !newHash) return false;
    if (purpose === 'CHANGE_EMAIL' && (!user.emailVerifiedAt || await tx.user.findUnique({ where: { email: token.email }, select: { id: true } }))) return false;
    const consumed = await tx.accountActionToken.updateMany({ where: { id: token.id, consumedAt: null, expiresAt: { gt: now } }, data: { consumedAt: now } });
    if (consumed.count !== 1) return false;
    await tx.user.update({ where: { id: user.id }, data: {
      sessionVersion: { increment: 1 },
      ...(purpose === 'VERIFY_EMAIL' ? { emailVerifiedAt: now } : {}),
      // Reset proves ownership of the current mailbox and allows recovery of a pre-created unverified account.
      ...(purpose === 'RESET_PASSWORD' ? { passwordHash: newHash, emailVerifiedAt: user.emailVerifiedAt || now } : {}),
      ...(purpose === 'CHANGE_EMAIL' ? { email: token.email, emailVerifiedAt: now } : {}),
    } });
    await tx.accountActionToken.updateMany({ where: { userId: user.id, consumedAt: null }, data: { consumedAt: now } });
    return true;
  });
}
