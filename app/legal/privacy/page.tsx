import { LegalDocument, type LegalSection } from '../LegalDocument';

const sections: LegalSection[] = [
  {
    id: 'information-collected',
    title: 'Information we collect',
    paragraphs: [
      'PhenoFarm collects information needed to create accounts, verify marketplace participants, operate catalog and request workflows, and support cultivator subscriptions.',
    ],
    bullets: [
      'Account details such as name, email address, role, and authentication records.',
      'Business profile details such as business name, contact information, addresses, and grower or dispensary settings.',
      'License and verification information for dispensaries, including license numbers, license status, and admin review records.',
      'Marketplace records such as products, strains, batches, inventory, documents, favorites, messages, quote terms, order request lines, request value, fulfillment status, and direct payment terms.',
      'Cultivator subscription records such as plan, status, Stripe customer identifiers, renewal dates, and billing portal availability.',
      'Support communications and basic technical data such as session, security, and device/browser information.',
    ],
  },
  {
    id: 'wholesale-payment-data',
    title: 'Wholesale payment data',
    paragraphs: [
      'PhenoFarm does not process wholesale payments between buyers and growers. The app may store request value, direct payment terms, and fulfillment records, but settlement happens directly between the licensed businesses outside PhenoFarm.',
      'Because wholesale payment is not processed in PhenoFarm, the MVP is not designed to collect wholesale card, bank, remittance, payout, escrow, or transfer details for buyer-seller settlement.',
    ],
  },
  {
    id: 'use-of-information',
    title: 'How we use information',
    bullets: [
      'Authenticate users and route them to the correct admin, grower, or dispensary workspace.',
      'Operate verification gates so unverified dispensaries cannot submit order requests.',
      'Publish grower catalog information and help buyers create request drafts.',
      'Record quote terms, messages, request status, fulfillment notes, and direct settlement terms for marketplace coordination.',
      'Provide support, investigate issues, maintain security, and improve MVP workflows.',
      'Operate grower subscription billing through Stripe Billing.',
    ],
  },
  {
    id: 'sharing',
    title: 'How information is shared',
    paragraphs: [
      'Marketplace information may be visible to the counterparties involved in a workflow. For example, growers may see buyer business details, request lines, quote responses, and fulfillment notes; dispensaries may see grower catalog details, quote terms, and request status.',
      'PhenoFarm may use service providers for hosting, database storage, authentication, support operations, and cultivator subscription billing. Stripe handles subscription checkout and billing portal workflows for growers.',
    ],
  },
  {
    id: 'retention-security',
    title: 'Retention and security',
    paragraphs: [
      'The MVP keeps account, business, license, catalog, message, quote, and order request records as needed to operate the marketplace, provide support, maintain auditability, and satisfy legal or compliance needs.',
      'PhenoFarm uses administrative access controls and application security practices appropriate for the MVP stage, but final production retention and security commitments should be reviewed by counsel before launch.',
    ],
  },
  {
    id: 'choices-contact',
    title: 'Choices and contact',
    paragraphs: [
      'Users can update many account, business, and license details in their workspace settings. For privacy questions, correction requests, or account support, contact support@phenoshop.app.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      description="How PhenoFarm handles account, business, license, marketplace, request, quote, and cultivator subscription data during the MVP."
      sections={sections}
    />
  );
}
