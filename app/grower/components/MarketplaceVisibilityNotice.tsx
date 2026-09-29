import Link from 'next/link';
import { isLicenseExpired } from '@/lib/license';

export function MarketplaceVisibilityNotice({ grower }: { grower: { isVerified: boolean; licenseExpiry?: Date | string | null } | null }) {
  if (grower?.isVerified && !isLicenseExpired(grower.licenseExpiry)) return null;
  return <section className="rounded-xl border border-pf-warning-line bg-pf-warning-bg p-4 text-sm text-pf-warning">
    <strong>Published listings are awaiting license review.</strong> Listings remain hidden from buyers until your account and current license are approved.{' '}
    <Link href="/grower/settings#business-profile" className="font-semibold underline">Review license details</Link>
  </section>;
}
