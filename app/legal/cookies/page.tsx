import type { Metadata } from 'next';
import { LegalDocument, type LegalSection } from '../LegalDocument';

export const metadata: Metadata = {
  "title": "Cookie Notice | PhenoShop",
  "description": "How cookies and browser storage support sign-in, preferences, and work in progress."
};

const sections: LegalSection[] = [
  {
    "id": "sign-in-and-security",
    "title": "Sign-in and security",
    "paragraphs": [
      "PhenoShop uses cookies to keep you signed in and protect authentication requests. Authentication sessions are configured to last up to 30 days and can be renewed during use or revoked earlier for security. Other authentication cookies support request protection and sign-in return navigation. Blocking these cookies may prevent sign-in."
    ]
  },
  {
    "id": "preferences-and-work-in-progress",
    "title": "Preferences and work in progress",
    "paragraphs": [
      "Local storage remembers information such as request drafts, pending-submission recovery details, saved searches, cached favorites, recent activity, table density, view preferences, and form defaults or drafts. Session storage supports temporary navigation and refresh state. These records can include business information. Local storage may persist after sign-out, so clear PhenoShop site data when you finish on a shared device. Clearing it can remove unsent drafts or recovery information; save or resolve important work first. Server-side business records are not deleted by clearing browser storage."
    ]
  },
  {
    "id": "external-services",
    "title": "External services",
    "paragraphs": [
      "Stripe may use its own cookies when you visit available subscription checkout or billing pages. Those pages are covered by Stripe's notices. Hosting and security services may use cookies needed to deliver or protect the site. The app does not currently embed advertising trackers or cross-site advertising cookies. If we introduce optional tracking, we will update this notice and provide consent or choice controls where required before enabling it."
    ]
  },
  {
    "id": "your-controls",
    "title": "Your controls",
    "paragraphs": [
      "Use your browser's settings to inspect, delete, or block cookies and site storage for phenoshop.app. Some features will stop working if essential storage is blocked. Contact support@phenoshop.app with questions, and read the Privacy Policy for how we handle information beyond browser storage."
    ]
  }
];

export default function CookiesPage() {
  return (
    <LegalDocument
      title="Cookie Notice"
      description="How cookies and browser storage support sign-in, preferences, and work in progress."
      sections={sections}
    />
  );
}
