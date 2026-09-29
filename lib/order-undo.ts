import { createHmac, timingSafeEqual } from 'node:crypto';
function signature(value: string) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret)
    throw new Error(
      'Order undo requires the configured authentication secret.'
    );
  return createHmac('sha256', secret).update(value).digest('base64url');
}
export function orderUndoToken(eventId: string, updatedAt: Date) {
  const value = Buffer.from(
    JSON.stringify({
      eventId,
      version: updatedAt.toISOString(),
      expiresAt: Date.now() + 15000,
    })
  ).toString('base64url');
  return `${value}.${signature(value)}`;
}
export function readOrderUndoToken(token: string) {
  try {
    const [value, mac, ...extra] = token.split('.');
    if (extra.length || !value || !mac) return null;
    const expected = Buffer.from(signature(value));
    const received = Buffer.from(mac);
    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    )
      return null;
    const data = JSON.parse(Buffer.from(value, 'base64url').toString());
    return typeof data.eventId === 'string' &&
      typeof data.version === 'string' &&
      Number(data.expiresAt) > Date.now()
      ? (data as { eventId: string; version: string; expiresAt: number })
      : null;
  } catch {
    return null;
  }
}
