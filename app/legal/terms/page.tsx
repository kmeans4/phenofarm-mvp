import sections from '@/lib/policies/2026-09-24/terms.json';
import type { Metadata } from 'next';
import { LegalDocument } from '../LegalDocument';

export const metadata: Metadata = {
  "title": "Terms of Service | PhenoShop",
  "description": "Terms for business accounts, listings, requests, and software subscriptions."
};



export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      description="Terms for business accounts, listings, requests, and software subscriptions."
      sections={sections}
    />
  );
}
