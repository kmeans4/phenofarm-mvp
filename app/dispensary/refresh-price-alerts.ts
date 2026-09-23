'use client';

const pending = new Map<string, Promise<unknown[]>>();
const completed = new Set<string>();

export async function refreshSessionPriceAlerts(userId: string, force = false): Promise<unknown[] | null> {
  const running = pending.get(userId);
  if (running) return running;
  const key = `phenofarm:${userId}:price-alerts-refreshed`;
  if (!force) {
    if (completed.has(userId)) return null;
    try { if (sessionStorage.getItem(key)) return null; } catch { /* Storage is optional. */ }
  }
  const request = (async () => {
    const response = await fetch('/api/dispensary/price-alerts/refresh', { method: 'POST' });
    const data = await response.json();
    if (!response.ok || !Array.isArray(data.alerts) || data.alerts.length > 20
      || data.alerts.some((alert: Record<string, unknown>) => !alert || typeof alert.productId !== 'string'
        || !Number.isFinite(Number(alert.targetPrice)) || Number(alert.targetPrice) <= 0)) {
      throw new Error('Could not refresh prices. Your saved alerts have been kept.');
    }
    completed.add(userId);
    try { sessionStorage.setItem(key, new Date().toISOString()); } catch { /* Storage is optional. */ }
    return data.alerts as unknown[];
  })();
  pending.set(userId, request);
  try { return await request; } finally { pending.delete(userId); }
}
