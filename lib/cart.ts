export const CART_STORAGE_KEY = 'phenofarm-cart';
export interface CartItem {
  id: string; name: string; grower: string; growerId: string;
  price: number; quantity: number; maxQty: number; unit?: string;
  strain?: string; thc?: number; image?: string; productType?: string;
  acceptedQuoteId?: string; quotedQuantity?: number; quotedUnitPrice?: number;
  listPrice?: number; unavailable?: boolean; requiresQuote?: boolean;
}
export interface Cart { items: CartItem[]; subtotal: number; tax: number; total: number }
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const price = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
const positiveInteger = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
const safeImage = (value: unknown) => typeof value === 'string' && value.length <= 2048 && /^(https?:\/\/|\/(?!\/))/.test(value) ? value : undefined;
export function getLineTotal(item: CartItem) {
  return item.acceptedQuoteId && item.quotedQuantity && item.quotedUnitPrice != null
    ? Math.min(item.quantity, item.quotedQuantity) * item.quotedUnitPrice + Math.max(0, item.quantity - item.quotedQuantity) * (item.listPrice ?? item.price)
    : item.price * item.quantity;
}
export function calculateTotals(items: CartItem[]) {
  const subtotal = Math.round(items.reduce((sum, item) => sum + getLineTotal(item), 0) * 100) / 100;
  return { subtotal, tax: 0, total: subtotal };
}
export function normalizeCart(value: unknown): Cart {
  const items: CartItem[] = [];
  const seen = new Set<string>();
  for (const raw of isRecord(value) && Array.isArray(value.items) ? value.items.slice(0, 200) : []) {
    if (!isRecord(raw) || typeof raw.id !== 'string' || !raw.id || typeof raw.growerId !== 'string' || !raw.growerId || !positiveInteger(raw.quantity) || seen.has(raw.id)) continue;
    seen.add(raw.id);
    items.push({ id: raw.id, growerId: raw.growerId,
      name: typeof raw.name === 'string' ? raw.name : 'Product', grower: typeof raw.grower === 'string' ? raw.grower : 'Grower',
      quantity: Math.min(Number(raw.quantity), 100000), maxQty: Math.max(0, Math.trunc(price(raw.maxQty))), price: price(raw.price),
      unit: typeof raw.unit === 'string' && raw.unit ? raw.unit : 'unit',
      strain: typeof raw.strain === 'string' ? raw.strain : undefined,
      productType: typeof raw.productType === 'string' ? raw.productType : undefined, image: safeImage(raw.image),
      ...(typeof raw.acceptedQuoteId === 'string' && positiveInteger(raw.quotedQuantity) && typeof raw.quotedUnitPrice === 'number' && raw.quotedUnitPrice >= 0 ? {
        acceptedQuoteId: raw.acceptedQuoteId, quotedQuantity: Number(raw.quotedQuantity), quotedUnitPrice: price(raw.quotedUnitPrice), listPrice: price(raw.listPrice),
      } : {}), unavailable: raw.unavailable === true, requiresQuote: raw.requiresQuote === true,
    });
  }
  return { items, ...calculateTotals(items) };
}
let cachedRaw: string | null | undefined;
let cachedCart = normalizeCart(null);
export function readCart(): Cart {
  if (typeof window === 'undefined') return cachedCart;
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      try { cachedCart = normalizeCart(raw ? JSON.parse(raw) : null); } catch { cachedCart = normalizeCart(null); }
    }
  } catch { /* Storage unavailable. Retain the in-memory cart. */ }
  return cachedCart;
}
export function writeCart(value: Cart): boolean {
  const cart = normalizeCart(value);
  const raw = JSON.stringify(cart);
  try {
    if (window.localStorage.getItem(CART_STORAGE_KEY) !== raw) {
      window.localStorage.setItem(CART_STORAGE_KEY, raw);
      cachedRaw = raw; cachedCart = cart;
      window.dispatchEvent(new Event('cart-updated'));
    }
    return true;
  } catch { return false; }
}
export function mergeCartItems(cart: Cart, additions: CartItem[]): Cart {
  const byId = new Map(cart.items.map(item => [item.id, item]));
  for (const item of normalizeCart({ items: additions }).items) {
    const existing = byId.get(item.id);
    byId.set(item.id, existing ? { ...existing, ...item, quantity: Math.min(existing.quantity + item.quantity, item.maxQty),
      ...(existing.acceptedQuoteId ? { acceptedQuoteId: existing.acceptedQuoteId, quotedQuantity: existing.quotedQuantity, quotedUnitPrice: existing.quotedUnitPrice } : {}) } : item);
  }
  return normalizeCart({ items: [...byId.values()] });
}
export function removeOrderedItems(cart: Cart, orders: Array<{ orderedProductIds?: string[] }>): Cart {
  const orderedIds = new Set(orders.flatMap(order => Array.isArray(order.orderedProductIds) ? order.orderedProductIds : []));
  return normalizeCart({ items: cart.items.filter(item => !orderedIds.has(item.id)) });
}
