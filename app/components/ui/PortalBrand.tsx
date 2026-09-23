import { SignOutButton } from '@/app/components/SignOutButton';

interface PortalBrandProps {
  portalLabel: string;
  compactOnMobile?: boolean;
}

export function PortalBrand({ portalLabel, compactOnMobile = false }: PortalBrandProps) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <span className={`font-editorial h-9 w-9 items-center justify-center rounded-[10px] bg-[#294c39] text-lg font-semibold text-[#eaf3ea] ring-1 ring-white/10 ${compactOnMobile ? 'hidden md:flex' : 'flex'}`}>
        P
      </span>
      <span className="min-w-0">
        <span className="font-editorial block text-[18px] font-semibold leading-none text-[#f2f5ee]">PhenoFarm</span>
        <span className="font-metadata mt-1 block text-[10px] font-medium uppercase tracking-[0.14em] text-[#7d947f]">
          {portalLabel}
        </span>
      </span>
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
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3f7d57] text-xs font-semibold text-[#eaf3ea]">
          {initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-[#e3ebe3]">{accountName}</span>
          <span className="block text-[11px] text-[#7d947f]">{roleLabel}</span>
        </span>
      </div>
      <div className="[&_button]:!rounded-lg [&_button]:!text-[#a9bcad] [&_button]:hover:!bg-white/[0.06] [&_button]:hover:!text-white">
        <SignOutButton variant="sidebar" />
      </div>
    </div>
  );
}
