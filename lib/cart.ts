export const CART_STORAGE_KEY = 'phenofarm-cart';
export interface CartItem {
  id: string;
  name: string;
  grower: string;
  growerId: string;
  price: number;
  quantity: number;
  maxQty: number;
  unit?: string;
  strain?: string;
  thc?: number;
  image?: string;
  productType?: string;
  acceptedQuoteId?: string;
  quotedQuantity?: number;
  quotedUnitPrice?: number;
  listPrice?: number;
  unavailable?: boolean;
  requiresQuote?: boolean;
}
export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));
const price = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
const positiveInteger = (value: unknown) =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
const safeImage = (value: unknown) =>
  typeof value === 'string' &&
  value.length <= 2048 &&
  /^(https?:\/\/|\/(?!\/))/.test(value)
    ? value
    : undefined;
export function getLineTotal(item: CartItem) {
  return item.acceptedQuoteId &&
    item.quotedQuantity &&
    item.quotedUnitPrice != null
    ? Math.min(item.quantity, item.quotedQuantity) * item.quotedUnitPrice +
        Math.max(0, item.quantity - item.quotedQuantity) *
          (item.listPrice ?? item.price)
    : item.price * item.quantity;
}
export function calculateTotals(items: CartItem[]) {
  const subtotal =
    Math.round(items.reduce((sum, item) => sum + getLineTotal(item), 0) * 100) /
    100;
  return { subtotal, tax: 0, total: subtotal };
}
export function normalizeCart(value: unknown): Cart {
  const items: CartItem[] = [];
  const seen = new Set<string>();
  for (const raw of isRecord(value) && Array.isArray(value.items)
    ? value.items.slice(0, 200)
    : []) {
    if (
      !isRecord(raw) ||
      typeof raw.id !== 'string' ||
      !raw.id ||
      typeof raw.growerId !== 'string' ||
      !raw.growerId ||
      !positiveInteger(raw.quantity) ||
      seen.has(raw.id)
    )
      continue;
    seen.add(raw.id);
    items.push({
      id: raw.id,
      growerId: raw.growerId,
      name: typeof raw.name === 'string' ? raw.name : 'Product',
      grower: typeof raw.grower === 'string' ? raw.grower : 'Grower',
      quantity: Math.min(Number(raw.quantity), 100000),
      maxQty: Math.max(0, Math.trunc(price(raw.maxQty))),
      price: price(raw.price),
      unit: typeof raw.unit === 'string' && raw.unit ? raw.unit : 'unit',
      strain: typeof raw.strain === 'string' ? raw.strain : undefined,
      productType:
        typeof raw.productType === 'string' ? raw.productType : undefined,
      image: safeImage(raw.image),
      ...(typeof raw.acceptedQuoteId === 'string' &&
      positiveInteger(raw.quotedQuantity) &&
      typeof raw.quotedUnitPrice === 'number' &&
      raw.quotedUnitPrice >= 0
        ? {
            acceptedQuoteId: raw.acceptedQuoteId,
            quotedQuantity: Number(raw.quotedQuantity),
            quotedUnitPrice: price(raw.quotedUnitPrice),
            listPrice: price(raw.listPrice),
          }
        : {}),
      unavailable: raw.unavailable === true,
      requiresQuote: raw.requiresQuote === true,
    });
  }
  return { items, ...calculateTotals(items) };
}
let storageKey = CART_STORAGE_KEY;
let cachedRaw: string | null | undefined;
let cachedCart = normalizeCart(null);
let serverBaseline = normalizeCart(null);
let accountId: string | null = null;
let accountVersion = 0;
let hydrating: Promise<void> | null = null;
let saveQueue = Promise.resolve();
let syncError = '';
function publishCart(cart: Cart) {
  cachedCart = cart;
  cachedRaw = JSON.stringify(cart);
  try {
    window.localStorage.setItem(storageKey, cachedRaw);
  } catch {
    /* Account storage remains available. */
  }
  window.dispatchEvent(new Event('cart-updated'));
}
export function readCart(): Cart {
  if (typeof window === 'undefined' || !accountId) return normalizeCart(null);
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedCart = normalizeCart(raw ? JSON.parse(raw) : null);
    }
  } catch {
    /* Retain the in-memory cart. */
  }
  return cachedCart;
}
export function getCartSyncError() {
  return syncError;
}
export function syncAccountCart(userId: string) {
  if (accountId === userId && hydrating) return hydrating;
  const version = ++accountVersion;
  accountId = userId;
  storageKey = `phenoshop:${userId}:cart`;
  cachedRaw = undefined;
  cachedCart = normalizeCart(null);
  syncError = '';
  readCart();
  window.dispatchEvent(new Event('cart-updated'));
  let previousServer = normalizeCart(null);
  try {
    previousServer = normalizeCart(
      JSON.parse(localStorage.getItem(`${storageKey}:baseline`) || 'null')
    );
  } catch {}
  serverBaseline = previousServer;
  hydrating = (async () => {
    try {
      const response = await fetch('/api/dispensary/cart');
      if (!response.ok) throw new Error('Your cart could not sync.');
      const body = await response.json();
      if (accountId !== userId || accountVersion !== version) return;
      const server = normalizeCart(body.cart);
      const current = readCart();
      const changed = current.items.filter(
        (item) =>
          JSON.stringify(item) !==
          JSON.stringify(previousServer.items.find((old) => old.id === item.id))
      );
      const removed = new Set(
        previousServer.items
          .filter((item) => !current.items.some((next) => next.id === item.id))
          .map((item) => item.id)
      );
      const merged = new Map(
        server.items
          .filter((item) => !removed.has(item.id))
          .map((item) => [item.id, item])
      );
      // Cached unsynced changes are retried; a new browser begins with the account cart.
      changed.forEach((item) => merged.set(item.id, item));
      serverBaseline = server;
      try {
        localStorage.setItem(`${storageKey}:baseline`, JSON.stringify(server));
      } catch {}
      publishCart(normalizeCart({ items: [...merged.values()] }));
      syncError = '';
    } catch {
      if (accountId !== userId || accountVersion !== version) return;
      syncError = 'Your cart could not sync. Check your connection and retry.';
      window.dispatchEvent(new Event('cart-updated'));
    }
  })();
  const currentHydration = hydrating;
  void currentHydration
    .then(() => {
      if (accountId === userId && accountVersion === version) persistCart();
    })
    .finally(() => {
      if (hydrating === currentHydration) hydrating = null;
    });
  return hydrating;
}
export function resetAccountCart() {
  accountVersion++;
  accountId = null;
  hydrating = null;
  cachedRaw = undefined;
  cachedCart = normalizeCart(null);
  serverBaseline = normalizeCart(null);
  syncError = '';
  if (typeof window !== 'undefined')
    window.dispatchEvent(new Event('cart-updated'));
}
export async function waitForCartSync() {
  await hydrating;
}
export function retryCartSync() {
  persistCart(true);
}
function persistCart(force = false) {
  if (!accountId) return;
  const userId = accountId;
  const version = accountVersion;
  saveQueue = saveQueue
    .then(async () => {
      await hydrating;
      if (userId !== accountId || accountVersion !== version) return;
      const current = readCart();
      const before = serverBaseline;
      const changed = current.items.filter(
        (item) =>
          JSON.stringify(item) !==
          JSON.stringify(before.items.find((old) => old.id === item.id))
      );
      const removed = before.items
        .filter((item) => !current.items.some((next) => next.id === item.id))
        .map((item) => item.id);
      if (!changed.length && !removed.length && !force) return;
      const response = await fetch('/api/dispensary/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changed, removed }),
        keepalive: true,
      });
      if (!response.ok) throw new Error('Unable to save cart.');
      const body = await response.json();
      if (userId !== accountId || accountVersion !== version) return;
      const server = normalizeCart(body.cart);
      serverBaseline = server;
      try {
        localStorage.setItem(`${storageKey}:baseline`, JSON.stringify(server));
      } catch {}
      syncError = '';
      // Don't overwrite edits made while this write was in flight.
      if (JSON.stringify(readCart()) === JSON.stringify(current))
        publishCart(server);
      window.dispatchEvent(new Event('cart-sync-updated'));
    })
    .catch(() => {
      if (userId !== accountId || accountVersion !== version) return;
      syncError =
        'Your cart has unsaved changes. Check your connection and retry.';
      window.dispatchEvent(new Event('cart-sync-updated'));
    });
}
export function writeCart(value: Cart): boolean {
  if (typeof window === 'undefined' || !accountId) return false;
  const cart = normalizeCart(value);
  const changed = JSON.stringify(cart) !== JSON.stringify(readCart());
  if (changed) {
    publishCart(cart);
    persistCart();
  }
  return true;
}
export function mergeCartItems(cart: Cart, additions: CartItem[]): Cart {
  const byId = new Map(cart.items.map((item) => [item.id, item]));
  for (const item of normalizeCart({ items: additions }).items) {
    const existing = byId.get(item.id);
    byId.set(
      item.id,
      existing
        ? {
            ...existing,
            ...item,
            quantity: Math.min(existing.quantity + item.quantity, item.maxQty),
            ...(existing.acceptedQuoteId
              ? {
                  acceptedQuoteId: existing.acceptedQuoteId,
                  quotedQuantity: existing.quotedQuantity,
                  quotedUnitPrice: existing.quotedUnitPrice,
                }
              : {}),
          }
        : item
    );
  }
  return normalizeCart({ items: [...byId.values()] });
}
export function removeOrderedItems(
  cart: Cart,
  orders: Array<{ orderedProductIds?: string[] }>
): Cart {
  const orderedIds = new Set(
    orders.flatMap((order) =>
      Array.isArray(order.orderedProductIds) ? order.orderedProductIds : []
    )
  );
  return normalizeCart({
    items: cart.items.filter((item) => !orderedIds.has(item.id)),
  });
}
