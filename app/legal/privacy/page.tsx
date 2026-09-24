import sections from '@/lib/policies/2026-09-24/privacy.json';
import type { Metadata } from 'next';
import { LegalDocument } from '../LegalDocument';

export const metadata: Metadata = {
  "title": "Privacy Policy | PhenoShop",
  "description": "How PhenoShop collects, uses, shares, and retains information."
};



export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      description="How PhenoShop collects, uses, shares, and retains information."
      sections={sections}
    />
  );
}
