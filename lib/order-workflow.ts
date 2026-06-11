export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Submitted',
  CONFIRMED: 'Accepted',
  PROCESSING: 'Preparing',
  SHIPPED: 'Ready / In transit',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const ORDER_STATUS_VALUES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

export type OrderStatusValue = (typeof ORDER_STATUS_VALUES)[number];

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export const ORDER_STATUS_HELP: Record<string, string> = {
  PENDING: 'Waiting for grower review',
  CONFIRMED: 'Grower accepted the request',
  PROCESSING: 'Grower is preparing the order',
  SHIPPED: 'Ready, picked up, or in transit',
  DELIVERED: 'Fulfillment is complete',
  CANCELLED: 'Request was cancelled',
};

export const ORDER_STATUS_STEPS = [
  { status: 'PENDING', label: 'Submitted' },
  { status: 'CONFIRMED', label: 'Accepted' },
  { status: 'PROCESSING', label: 'Preparing' },
  { status: 'SHIPPED', label: 'Ready / In transit' },
  { status: 'DELIVERED', label: 'Delivered' },
];

export const PAYMENT_TERMS_OPTIONS = [
  'Handled directly',
  'Net 15',
  'Net 30',
  'ACH',
  'Check',
  'COD',
] as const;

export type PaymentTermsOption = (typeof PAYMENT_TERMS_OPTIONS)[number];

export interface OrderRequestNoteFields {
  fulfillmentMethod: string;
  requestedWindow: string;
  paymentTerms: string;
  buyerNotes: string;
}

export function getOrderStatusLabel(status: string) {
  return ORDER_STATUS_LABELS[status] || status;
}

export function getOrderStatusHelp(status: string) {
  return ORDER_STATUS_HELP[status] || 'Review the order request details';
}

export function isOrderStatus(value: unknown): value is OrderStatusValue {
  return typeof value === 'string' && ORDER_STATUS_VALUES.includes(value as OrderStatusValue);
}

export function getAllowedOrderStatusTransitions(status: string): OrderStatusValue[] {
  return isOrderStatus(status) ? ORDER_STATUS_TRANSITIONS[status] : [];
}

export function canTransitionOrderStatus(currentStatus: string, nextStatus: string) {
  if (currentStatus === nextStatus) return true;
  return getAllowedOrderStatusTransitions(currentStatus).includes(nextStatus as OrderStatusValue);
}

export function getInvalidOrderStatusTransitionMessage(currentStatus: string, nextStatus: string) {
  const allowed = getAllowedOrderStatusTransitions(currentStatus);
  const allowedLabels = allowed.map(getOrderStatusLabel).join(', ');
  return allowed.length > 0
    ? `Cannot move request from ${getOrderStatusLabel(currentStatus)} to ${getOrderStatusLabel(nextStatus)}. Allowed next steps: ${allowedLabels}.`
    : `Cannot move request from ${getOrderStatusLabel(currentStatus)} to ${getOrderStatusLabel(nextStatus)}.`;
}

export function buildOrderRequestNotes(fields: OrderRequestNoteFields) {
  const lines = [
    `Fulfillment method: ${fields.fulfillmentMethod || 'Flexible'}`,
    `Requested window: ${fields.requestedWindow || 'Coordinate with grower'}`,
    `Payment terms: ${fields.paymentTerms || 'Handled directly'}`,
  ];

  if (fields.buyerNotes.trim()) {
    lines.push(`Buyer notes: ${fields.buyerNotes.trim()}`);
  }

  return lines.join('\n');
}

export function parseOrderRequestNotes(notes: string | null) {
  const parsed: OrderRequestNoteFields = {
    fulfillmentMethod: '',
    requestedWindow: '',
    paymentTerms: '',
    buyerNotes: '',
  };

  if (!notes) return { details: parsed, legacyNotes: '' };

  const legacyLines: string[] = [];

  for (const line of notes.split('\n')) {
    const [rawKey, ...rest] = line.split(':');
    const value = rest.join(':').trim();
    const key = rawKey.trim().toLowerCase();

    if (key === 'fulfillment method') parsed.fulfillmentMethod = value;
    else if (key === 'requested window') parsed.requestedWindow = value;
    else if (key === 'payment terms') parsed.paymentTerms = value;
    else if (key === 'buyer notes') parsed.buyerNotes = value;
    else if (line.trim()) legacyLines.push(line.trim());
  }

  return { details: parsed, legacyNotes: legacyLines.join('\n') };
}
