export const COMMERCIAL_TERMS_STORAGE_KEY = 'phenofarm:commercial-terms:grower';
export const PRODUCT_DEFAULTS_STORAGE_KEY = 'phenofarm:defaults:product';
export const REQUEST_DEFAULTS_STORAGE_KEY = 'phenofarm:defaults:order-request';
export const RECENT_ACTIVITY_STORAGE_KEY = 'phenofarm:recent-activity';

export interface ProductDefaults {
  productType: string;
  unit: string;
  price: string;
  isPriceVisible: boolean;
}

export interface RequestDefaults {
  fulfillmentMethod: string;
  requestedWindow: string;
  paymentTerms: string;
  orderNotes: string;
}

export interface CommercialTermsDefaults {
  minimumOrder: string;
  fulfillmentMethods: string;
  fulfillmentRegion: string;
  paymentTerms: string;
  responseWindow: string;
  contactNote: string;
}

export const DEFAULT_COMMERCIAL_TERMS: CommercialTermsDefaults = {
  minimumOrder: 'No minimum set',
  fulfillmentMethods: 'Pickup or coordinated delivery',
  fulfillmentRegion: 'Vermont buyers',
  paymentTerms: 'Handled directly',
  responseWindow: 'Respond within 1 business day',
  contactNote: 'Message through PhenoFarm before confirming fulfillment.',
};

export const DEFAULT_PRODUCT_DEFAULTS: ProductDefaults = {
  productType: 'Flower',
  unit: 'Gram',
  price: '',
  isPriceVisible: true,
};

export const DEFAULT_REQUEST_DEFAULTS: RequestDefaults = {
  fulfillmentMethod: 'Flexible',
  requestedWindow: '',
  paymentTerms: 'Handled directly',
  orderNotes: '',
};

export const REQUEST_NOTE_TEMPLATES = [
  {
    label: 'Pickup',
    body: 'Pickup preferred. Please confirm available pickup windows and any receiving requirements.',
  },
  {
    label: 'Delivery',
    body: 'Delivery requested. Please confirm delivery availability, timing, and any route minimums.',
  },
  {
    label: 'Substitutions',
    body: 'If any requested item is unavailable, please suggest a comparable substitution before accepting.',
  },
  {
    label: 'Payment terms',
    body: 'Payment terms will be coordinated directly outside PhenoFarm after request acceptance.',
  },
];

export const MESSAGE_TEMPLATE_GROUPS = {
  DISPENSARY: [
    { label: 'Quote follow-up', body: 'Can you confirm quote terms, MOQ, and availability for this item?' },
    { label: 'Availability', body: 'Is this product still available in the requested quantity?' },
    { label: 'Delivery timing', body: 'Can you confirm pickup or delivery timing for this request?' },
    { label: 'Request update', body: 'Can you share the latest status and any next step needed from us?' },
    { label: 'Commercial terms', body: 'Please confirm direct payment terms and any receiving requirements before fulfillment.' },
  ],
  GROWER: [
    { label: 'Quote follow-up', body: 'I can confirm quote terms and availability. What quantity and timing are you targeting?' },
    { label: 'Availability', body: 'This item is available. I can confirm final quantity and fulfillment timing shortly.' },
    { label: 'Delivery timing', body: 'I can coordinate pickup or delivery timing once the request is accepted.' },
    { label: 'Request update', body: 'I am reviewing the request now and will update the fulfillment status shortly.' },
    { label: 'Commercial terms', body: 'Wholesale payment will be handled directly outside PhenoFarm after terms are confirmed.' },
  ],
} as const;
