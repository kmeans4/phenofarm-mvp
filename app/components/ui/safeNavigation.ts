/** Accept only a path in this app, never a scheme, protocol-relative URL, or backslash URL. */
export function safeInternalPath(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || !/^\/(?!\/)/.test(value) || /[\\\u0000-\u0020]/.test(value)) return fallback;
  try {
    const base = 'https://phenofarm.invalid';
    const parsed = new URL(value, base);
    return parsed.origin === base ? `${parsed.pathname}${parsed.search}${parsed.hash}` : fallback;
  } catch { return fallback; }
}
