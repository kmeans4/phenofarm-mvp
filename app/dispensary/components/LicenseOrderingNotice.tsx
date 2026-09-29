'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { isLicenseExpired } from '@/lib/license';
export function LicenseOrderingNotice() {
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/dispensary/settings', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data)
          setPending(
            data.licenseStatus !== 'verified' ||
              isLicenseExpired(data.licenseExpiry)
          );
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return pending ? (
    <p className="mb-4 rounded-lg border border-pf-warning-line bg-pf-warning-bg p-3 text-sm text-pf-warning">
      You can send orders once your license is approved — we’ll keep your cart.{' '}
      <Link
        className="inline-flex min-h-11 items-center font-semibold underline"
        href="/dispensary/settings#license-verification"
      >
        Check status
      </Link>
    </p>
  ) : null;
}
