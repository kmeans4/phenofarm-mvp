import Link from 'next/link';
import { SearchDialog, SearchTrigger } from '@/app/components/SearchDialog';
import { NotificationBell } from '@/app/components/notifications/NotificationBell';

export function PortalDesktopHeader({ accountName, role }: { accountName: string; role: 'grower' | 'dispensary' | 'admin' }) {
  const initials = accountName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  return (
    <header className={`relative z-20 hidden h-[72px] shrink-0 items-center gap-3 border-b border-pf-line px-6 lg:gap-5 ${role === 'admin' ? 'lg:flex' : 'md:flex'}`}>
      <Link href={`/${role}/settings`} className="min-w-0 flex-1 truncate text-sm font-semibold text-pf-text hover:text-pf-accent">{accountName}</Link>
      {role !== 'admin' && <>
        <div className="hidden w-[min(30vw,400px)] lg:block"><SearchDialog className="!bg-pf-raised/60 !border-pf-line !text-pf-muted [&_kbd]:!bg-pf-surface [&_kbd]:!border-pf-line" /></div>
        <SearchTrigger variant="icon" className="lg:hidden !border-pf-line !bg-pf-raised/60 !text-pf-muted" />
      </>}
      <NotificationBell compact />
      <Link href={`/${role}/settings`} aria-label="Account settings" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pf-line-strong bg-pf-raised text-xs font-semibold text-pf-text">{initials}</Link>
    </header>
  );
}
