import { LegalDocument, type LegalSection } from '../LegalDocument';

const sections: LegalSection[] = [
  {
    id: 'what-cookies-are',
    title: 'Cookies and storage',
    paragraphs: [
      'Cookies and browser storage help web applications remember session, security, and workflow information. Similar technologies may include local storage, session storage, and framework-managed session tokens.',
    ],
  },
  {
    id: 'essential-use',
    title: 'Essential use',
    paragraphs: [
      'PhenoFarm uses essential cookies and storage for authentication, account routing, session security, marketplace workflow continuity, and request-draft usability.',
    ],
    bullets: [
      'Sign-in and session cookies used by authentication workflows.',
      'Security and framework cookies needed to keep the app operating correctly.',
      'Browser storage for request draft details, workflow defaults, and similar MVP usability features.',
      'Support or operational data needed to diagnose account, verification, or request issues.',
    ],
  },
  {
    id: 'billing-and-third-parties',
    title: 'Billing and third-party services',
    paragraphs: [
      'Cultivator subscription checkout and subscription management are handled through Stripe Billing. Stripe may use its own cookies or browser storage when a grower opens checkout or the billing portal.',
      'PhenoFarm does not use cookies to process wholesale buyer-seller payments because wholesale settlement is handled directly outside the app.',
    ],
  },
  {
    id: 'analytics-advertising',
    title: 'Analytics and advertising',
    paragraphs: [
      'The MVP copy does not assume advertising cookies or cross-site ad tracking. If PhenoFarm adds analytics, performance monitoring, or marketing tools before launch, this notice should be updated to describe those tools clearly.',
    ],
  },
  {
    id: 'choices',
    title: 'Your choices',
    paragraphs: [
      'Most browsers let you block or delete cookies and storage. Blocking essential cookies may prevent sign-in, role routing, request drafts, or subscription management from working correctly.',
      'Questions about cookies or browser storage should be sent to support@phenoshop.app.',
    ],
  },
];

export default function CookiesPage() {
  return (
    <LegalDocument
      title="Cookie Notice"
      description="How PhenoFarm uses essential cookies and browser storage for authentication, session security, request workflows, and cultivator subscription support."
      sections={sections}
    />
  );
}
