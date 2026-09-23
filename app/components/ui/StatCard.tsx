import { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: ReactNode;
  helperText?: ReactNode;
  trend?: string;
  trendUp?: boolean;
  isEmpty?: boolean;
  href?: string;
  icon?: ReactNode;
  valueClassName?: string;
  className?: string;
  compact?: boolean;
}

export function StatCard({
  title,
  value,
  helperText,
  trend,
  trendUp = true,
  isEmpty = false,
  href,
  icon,
  valueClassName,
  className,
  compact = false,
}: StatCardProps) {
  const content = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-pf-muted">{title}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <p className={cn('text-2xl font-semibold tracking-tight text-pf-text sm:text-[1.7rem]', valueClassName)}>{value}</p>
          {trend && !isEmpty ? (
            <span className={cn('text-xs font-medium sm:text-sm', trendUp ? 'text-pf-accent' : 'text-pf-danger')}>
              {trend}
            </span>
          ) : null}
        </div>
        {helperText ? <p className="mt-1 text-xs text-pf-muted">{helperText}</p> : null}
      </div>
      {href ? (
        <span className={cn('mt-1 h-7 w-7 items-center justify-center rounded-full bg-pf-surface text-pf-muted transition-colors group-hover:bg-pf-accent-bg group-hover:text-pf-accent', compact ? 'hidden sm:inline-flex' : 'inline-flex')}>
          <ChevronRight className="h-4 w-4" />
        </span>
      ) : icon ? (
        <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-pf-surface text-pf-muted">
          {icon}
        </span>
      ) : null}
    </div>
  );

  const cardClassName = cn(
    'rounded-[15px] border border-pf-line bg-pf-surface shadow-sm transition-all',
    compact ? 'p-3 sm:p-5' : 'p-4 sm:p-[18px]',
    href ? 'group block hover:-translate-y-0.5 hover:border-pf-line-strong hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 ring-offset-pf-canvas' : 'hover:shadow-md',
    isEmpty && 'opacity-75',
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cardClassName}>
        {content}
      </Link>
    );
  }

  return <div className={cardClassName}>{content}</div>;
}
