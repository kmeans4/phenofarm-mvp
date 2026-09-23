import { randomUUID } from 'node:crypto';

type AccountMail = { to: string; subject: string; text: string };

const loopback = (hostname: string) => ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname);

export function accountOrigin() {
  const url = new URL(process.env.NEXTAUTH_URL || '');
  if (url.username || url.password || (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback(url.hostname)))) {
    throw new Error('Account origin is not configured securely');
  }
  return url.origin;
}

function mailConfiguration() {
  const origin = accountOrigin();
  if (process.env.AUTH_MAIL_PROVIDER === 'local-test') {
    const target = new URL(process.env.AUTH_MAIL_TEST_URL || '');
    const database = new URL(process.env.DATABASE_URL || '');
    // A test sink must never be usable on Vercel, a remote DB, or a production build.
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL || !loopback(new URL(origin).hostname)
      || !loopback(database.hostname) || !/^\/phenofarm_auth_/.test(database.pathname)
      || !loopback(target.hostname) || target.protocol !== 'http:' || target.username || target.password
      || !process.env.AUTH_MAIL_TEST_KEY || process.env.AUTH_MAIL_TEST_KEY.length < 32) {
      throw new Error('Local account mail adapter is not permitted');
    }
    return { provider: 'local-test' as const, endpoint: target.href, key: process.env.AUTH_MAIL_TEST_KEY };
  }
  if (process.env.AUTH_MAIL_PROVIDER !== 'resend' || !process.env.RESEND_API_KEY || !process.env.AUTH_MAIL_FROM) {
    throw new Error('Account email delivery is not configured');
  }
  return { provider: 'resend' as const, endpoint: 'https://api.resend.com/emails', key: process.env.RESEND_API_KEY };
}

export function accountMailConfigured() {
  try { mailConfiguration(); return true; } catch { return false; }
}

export async function sendAccountMail(mail: AccountMail) {
  const config = mailConfiguration();
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.key}`, 'Idempotency-Key': randomUUID() },
    body: JSON.stringify(config.provider === 'local-test' ? mail : {
      from: process.env.AUTH_MAIL_FROM, to: [mail.to], subject: mail.subject, text: mail.text,
      ...(process.env.AUTH_MAIL_REPLY_TO ? { reply_to: process.env.AUTH_MAIL_REPLY_TO } : {}),
    }),
    signal: AbortSignal.timeout(12_000),
    redirect: 'error',
    cache: 'no-store',
  });
  // Do not include provider responses, recipients, request bodies or token links in errors.
  if (!response.ok) throw new Error('Account email delivery failed');
}
