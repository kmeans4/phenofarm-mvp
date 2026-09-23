import { SignOutButton } from '@/app/components/SignOutButton';

interface PortalBrandProps {
  portalLabel: string;
  compactOnMobile?: boolean;
}

export function PortalBrand({ portalLabel, compactOnMobile = false }: PortalBrandProps) {
  return (
    <div className="flex items-center gap-2.5 px-1" aria-label={`PhenoFarm ${portalLabel}`}>
      <span className={`h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-white ${compactOnMobile ? 'hidden sm:flex' : 'flex'}`}>PF</span>
      <span className="text-[18px] font-semibold tracking-tight text-pf-text">PhenoFarm</span>
    </div>
  );
}

interface PortalAccountProps {
  accountName: string;
  roleLabel: string;
}

export function PortalAccount({ accountName, roleLabel }: PortalAccountProps) {
  const initials = accountName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'PF';

  return (
    <div className="border-t border-white/[0.07] px-1 pt-4">
      <div className="flex items-center gap-2.5 px-2 pb-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pf-accent-bg text-xs font-semibold text-pf-accent">
          {initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-pf-text">{accountName}</span>
          <span className="block text-[11px] text-pf-muted">{roleLabel}</span>
        </span>
      </div>
      <div className="[&_button]:!rounded-lg [&_button]:!text-pf-secondary [&_button]:hover:!bg-white/[0.06] [&_button]:hover:!text-white">
        <SignOutButton variant="sidebar" />
      </div>
    </div>
  );
}
