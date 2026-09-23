import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  compact?: boolean;
  mobileInlineActions?: boolean;
  hideDescriptionOnMobile?: boolean;
}

export function PageHeader({ title, eyebrow, description, actions, className, compact = true, mobileInlineActions = false, hideDescriptionOnMobile = false }: PageHeaderProps) {
  return (
    <header className={cn('flex gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4', mobileInlineActions ? 'flex-row items-center justify-between' : 'flex-col', className)}>
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <p className="font-metadata text-[11px] font-medium uppercase tracking-[0.16em] text-pf-accent">{eyebrow}</p>
        ) : null}
        <h1 className={cn("font-semibold leading-none text-pf-text sm:text-[2rem]", compact ? "text-[1.75rem]" : "text-[2rem]")}>{title}</h1>
        {description ? (
          <p className={cn("max-w-3xl text-sm leading-relaxed text-pf-muted", hideDescriptionOnMobile && "hidden sm:block")}>{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className={cn('flex flex-wrap gap-2 sm:w-auto sm:items-center sm:justify-end', mobileInlineActions ? 'w-auto shrink-0 items-center' : 'w-full')}>
          {actions}
        </div>
      ) : null}
    </header>
  );
}
