import { AsyncLocalStorage } from 'node:async_hooks';
import { after } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { db } from '@/lib/db';

const reporting = new AsyncLocalStorage<boolean>();
export const isReportingError = () => reporting.getStore() === true;

export const monitoringEnabled = () => process.env.MONITORING_ENABLED === 'true';
export function monitorAuthorized(request: Request) {
  const token = process.env.MONITORING_TOKEN;
  const supplied = request.headers.get('authorization') || '';
  if (!token || token.length < 32) return false;
  const expected = `Bearer ${token}`;
  const a = Buffer.from(supplied), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Never transmit error text, request data, account information, tokens, or URLs.
// Resend deduplicates the fixed alert for each 15-minute UTC interval, across instances.
async function sendErrorAlert() {
  if (!process.env.RESEND_API_KEY || !process.env.AUTH_MAIL_FROM) return;
  const bucket = Math.floor(Date.now() / 900_000);
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(8000),
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `phenoshop-server-error-${bucket}` },
    body: JSON.stringify({ from: process.env.AUTH_MAIL_FROM, to: ['support@phenoshop.app'],
      subject: 'Action needed: PhenoShop server error',
      text: `PhenoShop recorded a server error during monitoring interval ${bucket}. Check production runtime logs in Vercel and the private website-monitor workflow in kmeans4/phenoshop-backups. This alert contains no customer data. Repeated errors in this 15-minute interval share one email. A recovery check runs independently of the website.` }) });
  if (!response.ok && response.status !== 409) throw new Error('Monitor mail unavailable');
}

export async function recordServerError() {
  if (!monitoringEnabled()) return;
  // Both paths run even when one provider is down. No rejection may affect users.
  const results = await reporting.run(true, () => Promise.allSettled([
    db.operationalSignal.upsert({ where: { id: 'server-error' }, create: { id: 'server-error', count: 1 }, update: { count: { increment: 1 }, lastOccurredAt: new Date() } }),
    sendErrorAlert(),
  ]));
  if (results.some(result => result.status === 'rejected')) console.warn('[monitoring] One or more error reporting channels failed');
}

export function scheduleServerError() {
  if (!monitoringEnabled()) return;
  try { after(recordServerError); }
  catch { void recordServerError(); } // Startup errors have no request lifecycle.
}
