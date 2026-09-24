import { LegalDocument, type LegalSection } from '../LegalDocument';

const sections: LegalSection[] = [
  {
    id: 'eligible-users',
    title: 'Eligible users',
    paragraphs: [
      'PhenoFarm is intended for licensed cannabis cultivators, dispensaries, retailers, and authorized staff using the product for B2B marketplace workflows. Users are responsible for providing accurate account, business, contact, and license information.',
    ],
  },
  {
    id: 'accounts-verification',
    title: 'Accounts and verification',
    paragraphs: [
      'Account access is role-based. Admins manage marketplace oversight, growers manage catalog and request workflows, and dispensaries browse, draft requests, and manage buyer settings.',
      'Dispensary ordering is gated by license verification. A dispensary may be able to create an account and browse parts of the app before it is verified, but order request submission unlocks only after PhenoFarm verifies the license.',
    ],
  },
  {
    id: 'marketplace-workflows',
    title: 'Marketplace workflows',
    paragraphs: [
      'Growers may create product listings, manage inventory, attach relevant documents, message buyers, send quote terms, and review order requests. Dispensaries may browse growers and products, request quote terms, add products to a request draft, and submit order requests after verification.',
      'Order requests use friendly status labels: Submitted, Accepted, Preparing, Ready / In transit, Delivered, and Cancelled. These labels describe operational workflow status and do not represent payment processing by PhenoFarm.',
    ],
  },
  {
    id: 'direct-settlement',
    title: 'Direct settlement',
    paragraphs: [
      'PhenoFarm does not collect, remit, escrow, finance, or pay out wholesale order funds. Buyers and growers are responsible for invoices, taxes, payment terms, delivery terms, compliance obligations, and settlement outside PhenoFarm.',
      'Request value, quote terms, and direct payment terms may be recorded in the app for coordination and reporting, but they are informational marketplace records rather than in-app payment instructions.',
    ],
  },
  {
    id: 'cultivator-subscriptions',
    title: 'Cultivator subscriptions',
    paragraphs: [
      'The only in-app payment flow is the cultivator software subscription. Growers may use Free, Pro, or Business plan access depending on the configured subscription state.',
      'Paid grower subscription checkout and subscription management use Stripe Billing. Stripe price IDs and portal availability may vary by environment while the MVP is being configured.',
    ],
  },
  {
    id: 'user-responsibilities',
    title: 'User responsibilities',
    bullets: [
      'Keep business, contact, catalog, inventory, license, and order request information accurate.',
      'Use PhenoFarm only for lawful licensed cannabis business workflows.',
      'Do not submit false license information, misleading product records, or unauthorized account access attempts.',
      'Coordinate fulfillment and settlement directly with the counterparty and comply with applicable laws and regulations.',
    ],
  },
  {
    id: 'support-changes',
    title: 'Support and changes',
    paragraphs: [
      'During the MVP, support requests should be sent to support@phenoshop.app. PhenoFarm may update these draft terms as workflows, compliance requirements, and counsel-reviewed production terms evolve.',
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      description="Draft operating terms for licensed marketplace accounts, verification-gated ordering, quote workflows, direct wholesale settlement, and cultivator subscription billing."
      sections={sections}
    />
  );
}
