export function normalizeOrderDefaults(value: unknown) {
  const raw =
    value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {};
  const text = (key: string, limit: number) =>
    typeof raw[key] === 'string' ? raw[key].trim().slice(0, limit) : '';
  return {
    fulfillmentMethod: [
      'Pickup',
      'Delivery requested',
      'Coordinate with grower',
    ].includes(String(raw.fulfillmentMethod))
      ? String(raw.fulfillmentMethod)
      : 'Coordinate with grower',
    requestedWindow: text('requestedWindow', 120),
    paymentTerms: text('paymentTerms', 120),
    orderNotes: text('orderNotes', 500),
  };
}
