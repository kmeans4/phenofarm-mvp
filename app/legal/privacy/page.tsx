import type { Metadata } from 'next';
import { LegalDocument, type LegalSection } from '../LegalDocument';

export const metadata: Metadata = {
  "title": "Privacy Policy | PhenoShop",
  "description": "How PhenoShop collects, uses, shares, and retains information."
};

const sections: LegalSection[] = [
  {
    "id": "who-we-are-and-what-this-covers",
    "title": "Who we are and what this covers",
    "paragraphs": [
      "PhenoShop, operating the PhenoFarm service at phenoshop.app, is responsible for the information described in this policy. Contact support@phenoshop.app or 166 Skeet Road, Medford, NJ 08055 about privacy. This policy covers our website, business accounts, marketplace tools, and support. Other businesses you deal with and external services have their own privacy practices."
    ]
  },
  {
    "id": "information-we-collect",
    "title": "Information we collect",
    "paragraphs": [
      "We obtain information from you, your authorized staff, the businesses you interact with, our service providers, and license information reviewed for eligibility. Some information is generated when you use the service. Do not upload patient or consumer health information, government identification documents, passwords, payment-card details, or bank account numbers. Settlement records may contain financial references that users enter even though PhenoShop does not process wholesale payments."
    ],
    "bullets": [
      "Account information: your name, email address, account role, password hash, verification status, and security records.",
      "Business and license information: business name, authorized contacts, addresses, phone numbers, license numbers, status and expiry dates, and information used for account review.",
      "Business activity: listings, strains, batches, inventory, images, lab reports, documents, saved products and searches, alerts, messages, quotes, order requests, fulfillment details, and settlement notes or references you enter.",
      "Software billing records: plan, subscription status, billing dates, and payment-provider customer, checkout, or subscription identifiers. Stripe collects payment details in its own checkout; PhenoShop does not store full payment-card numbers through that flow.",
      "Support and technical information: correspondence, authentication events, browser and device information, request and error logs, IP addresses handled by hosting/security services, and cookies or browser storage described in our Cookie Notice. Application rate-limit counters use keyed hashes of relevant identifiers rather than storing raw IP addresses or email addresses in those counters."
    ]
  },
  {
    "id": "how-we-use-information",
    "title": "How we use information",
    "paragraphs": [
      "We use information to create and secure accounts; deliver verification, recovery, and service messages; review business eligibility; display listings and uploaded reports; operate messages, quotes, inventory, requests, and records; manage software subscriptions when available; provide support; investigate misuse; diagnose and improve the service; and meet legal obligations. We do not use your personal information for cross-site targeted advertising or sell it to data brokers. We do not use automated profiling to make decisions with legal or similarly significant effects about you."
    ]
  },
  {
    "id": "who-can-see-information",
    "title": "Who can see information",
    "paragraphs": [
      "Marketplace participants can see published business profiles, listings, and associated reports that the service makes available. Counterparties can see the business contact details and records needed for their messages, quotes, requests, and fulfillment. Administrators can access information needed for verification, support, security, and service operations. A buyer or grower that downloads or receives information may retain its own copy under its policies and legal obligations.",
      "Uploaded files are stored using public file links. A person who obtains a link may be able to access the file without signing in, even when the app's download control requires an account. Upload only documents suitable for sharing. Deleting a listing or removing its attachment does not by itself erase the stored file. Ask support to remove a file from storage; we cannot recall copies already downloaded.",
      "We use providers to operate the service: Vercel for hosting and file storage, Neon for the database, Resend for account emails, Porkbun for support email, and Stripe for available software subscription billing. Information handled in support email is also accessible through the operator's email software. Providers process relevant information to supply their services and may have their own obligations and policies. Processing may occur in the United States and other locations where providers operate.",
      "We may disclose information to comply with applicable law or a valid legal request, protect rights and safety, investigate fraud or security incidents, or as part of a business transfer subject to appropriate protections and notice where required. These purposes do not give marketplace users permission to misuse another user's information."
    ]
  },
  {
    "id": "retention-and-deletion",
    "title": "Retention and deletion",
    "paragraphs": [
      "We retain account and business information while an account is active and as needed to operate the service. Order, quote, message, license-review, subscription, and support records may need to be kept after closure to meet legal or accounting obligations, resolve disputes, prevent abuse, or preserve another business's legitimate records. We determine retention by the record's purpose, applicable obligations, active disputes, and whether personal details can be deleted or anonymized without compromising those needs.",
      "Account closure and privacy deletion requests are handled through support; they are not instant, automatic deletion of every associated record. Deleting a product normally hides it from the catalog while preserving business history. When information no longer needs to be retained, we delete it or remove identifying details. Copies in restricted backups may remain until those backups expire under the applicable provider settings. If a backup is restored, applicable deletion decisions must be reapplied.",
      "Recovery and verification links expire after a short period and can be used only once. Expired action-token and rate-limit records are removed through application cleanup during subsequent security activity; expiry does not promise immediate erasure. Browser storage remains until the feature clears it, the browser session ends where applicable, or you clear site data. See the Cookie Notice for more detail."
    ]
  },
  {
    "id": "security",
    "title": "Security",
    "paragraphs": [
      "We use access controls, hashed passwords, expiring account links, session revocation, and other measures intended to protect information. No service can guarantee complete security. Protect your credentials, sign out on shared devices, and report suspected unauthorized access to support. Do not include passwords or recovery links in a report."
    ]
  },
  {
    "id": "your-choices-and-requests",
    "title": "Your choices and requests",
    "paragraphs": [
      "You can change supported business details in settings and ask support to correct other information, provide access or a copy, close an account, or delete personal information. Depending on applicable law, you may also have rights to portability, restrictions on processing, or review of a denied request. Email support@phenoshop.app from your account email when possible; you do not need to create a new account to make a request. Tell us what you are requesting without attaching sensitive identity documents.",
      "We will verify identity and authority proportionately, respond within applicable legal time limits, and explain any information we must retain or other reason we cannot fulfill a request. An authorized agent may contact us; we may need to confirm their authority. If you disagree with a decision, reply asking for review. You may also contact the relevant privacy regulator. We will not penalize you for exercising rights, though deleting information necessary to operate your account may prevent continued service. Service and security emails are necessary for account operation."
    ]
  },
  {
    "id": "children-and-changes",
    "title": "Children and changes",
    "paragraphs": [
      "PhenoShop is for authorized business users aged 21 or older, not children or consumer cannabis customers. If you believe a child has provided information, contact support so we can investigate and remove it as appropriate. We will update this policy when practices change, show the effective date, and provide notice of material changes through the service or account email. Where required, we will obtain consent before a materially different use."
    ]
  }
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      description="How PhenoShop collects, uses, shares, and retains information."
      sections={sections}
    />
  );
}
