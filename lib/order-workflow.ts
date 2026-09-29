export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'New',
  CONFIRMED: 'Accepted',
  PROCESSING: 'Preparing',
  SHIPPED: 'On the way',
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

export const ORDER_STATUS_TRANSITIONS: Record<
  OrderStatusValue,
  OrderStatusValue[]
> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export const ORDER_STATUS_HELP: Record<string, string> = {
  PENDING: 'Waiting for grower review',
  CONFIRMED: 'Grower accepted the order',
  PROCESSING: 'Grower is preparing the order',
  SHIPPED: 'Picked up or in transit',
  DELIVERED: 'Order delivered',
  CANCELLED: 'Order was cancelled',
};

export const ORDER_STATUS_STEPS = [
  { status: 'PENDING', label: 'New' },
  { status: 'CONFIRMED', label: 'Accepted' },
  { status: 'PROCESSING', label: 'Preparing' },
  { status: 'SHIPPED', label: 'On the way' },
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
  deliveryAddress?: string;
}

export function getOrderStatusLabel(status: string) {
  return ORDER_STATUS_LABELS[status] || status;
}

export function getOrderStatusHelp(status: string) {
  return ORDER_STATUS_HELP[status] || 'Review the order details';
}

export function isOrderStatus(value: unknown): value is OrderStatusValue {
  return (
    typeof value === 'string' &&
    ORDER_STATUS_VALUES.includes(value as OrderStatusValue)
  );
}

export function getAllowedOrderStatusTransitions(
  status: string
): OrderStatusValue[] {
  return isOrderStatus(status) ? ORDER_STATUS_TRANSITIONS[status] : [];
}

export function canTransitionOrderStatus(
  currentStatus: string,
  nextStatus: string
) {
  if (currentStatus === nextStatus) return true;
  return getAllowedOrderStatusTransitions(currentStatus).includes(
    nextStatus as OrderStatusValue
  );
}

export function canEditOrderItems(status: string) {
  return (
    status === 'PENDING' || status === 'CONFIRMED' || status === 'PROCESSING'
  );
}

export function getInvalidOrderStatusTransitionMessage(
  currentStatus: string,
  nextStatus: string
) {
  const allowed = getAllowedOrderStatusTransitions(currentStatus);
  const allowedLabels = allowed.map(getOrderStatusLabel).join(', ');
  return allowed.length > 0
    ? `Cannot move order from ${getOrderStatusLabel(currentStatus)} to ${getOrderStatusLabel(nextStatus)}. Allowed next steps: ${allowedLabels}.`
    : `Cannot move order from ${getOrderStatusLabel(currentStatus)} to ${getOrderStatusLabel(nextStatus)}.`;
}

export function buildOrderRequestNotes(fields: OrderRequestNoteFields) {
  const lines = [
    `Fulfillment method: ${fields.fulfillmentMethod || 'Flexible'}`,
    `Requested window: ${fields.requestedWindow || 'Coordinate with grower'}`,
    `Payment terms: ${fields.paymentTerms || 'Handled directly'}`,
    ...(fields.deliveryAddress?.trim()
      ? [
          `Delivery address: ${fields.deliveryAddress.trim().replace(/\n/g, ', ')}`,
        ]
      : []),
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

  if (!notes) return { details: parsed, legacyNotes: '', notesText: '' };

  const legacyLines: string[] = [];
  const visibleLines: string[] = [];
  let freeText = false;

  for (const line of notes.split('\n')) {
    const [rawKey, ...rest] = line.split(':');
    const value = rest.join(':').trim();
    const key = rawKey.trim().toLowerCase();

    // Only the initial structured header is metadata. Everything after buyer
    // notes (including later settlement records) is free text and must survive.
    if (
      !freeText &&
      rest.length &&
      key === 'fulfillment method' &&
      !parsed.fulfillmentMethod
    )
      parsed.fulfillmentMethod = value;
    else if (
      !freeText &&
      rest.length &&
      key === 'requested window' &&
      !parsed.requestedWindow
    )
      parsed.requestedWindow = value;
    else if (
      !freeText &&
      rest.length &&
      key === 'payment terms' &&
      !parsed.paymentTerms
    )
      parsed.paymentTerms = value;
    else if (!freeText && rest.length && key === 'delivery address')
      parsed.deliveryAddress = value;
    else if (!freeText && rest.length && key === 'buyer notes') {
      parsed.buyerNotes = value;
      visibleLines.push(value);
      freeText = true;
    } else {
      legacyLines.push(line);
      visibleLines.push(line);
      if (line.trim()) freeText = true;
    }
  }

  return {
    details: parsed,
    legacyNotes: legacyLines.join('\n').trim(),
    notesText: visibleLines.join('\n').trim(),
  };
}
