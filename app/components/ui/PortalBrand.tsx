import { BrandLogo } from './BrandLogo';
import Link from 'next/link';
import { SignOutButton } from '@/app/components/SignOutButton';

interface PortalBrandProps {
  portalLabel: string;
  compactOnMobile?: boolean;
}

export function PortalBrand({
  portalLabel,
  compactOnMobile = false,
}: PortalBrandProps) {
  return (
    <Link
      href={`/${portalLabel.toLowerCase().includes('admin') ? 'admin' : portalLabel.toLowerCase().includes('grower') ? 'grower' : 'dispensary'}/dashboard`}
      className="flex min-h-11 flex-col items-start justify-center gap-1 px-1"
      aria-label={`PhenoShop ${portalLabel} overview`}
    >
      <BrandLogo
        className={compactOnMobile ? 'w-[108px] sm:w-40' : 'w-36 sm:w-40'}
      />
      <span className="text-sm text-pf-muted">{portalLabel}</span>
    </Link>
  );
}

interface PortalAccountProps {
  accountName: string;
  roleLabel: string;
}

export function PortalAccount({ accountName, roleLabel }: PortalAccountProps) {
  const initials =
    accountName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'PS';

  return (
    <div className="border-t border-white/[0.07] px-1 pt-4">
      <div className="flex items-center gap-2.5 px-2 pb-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pf-accent-bg text-xs font-semibold text-pf-accent">
          {initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-pf-text">
            {accountName}
          </span>
          <span className="block text-xs text-pf-muted">{roleLabel}</span>
        </span>
      </div>
      <div className="[&_button]:!rounded-lg [&_button]:!text-pf-secondary [&_button]:hover:!bg-white/[0.06] [&_button]:hover:!text-white">
        <SignOutButton variant="sidebar" />
      </div>
    </div>
  );
}
