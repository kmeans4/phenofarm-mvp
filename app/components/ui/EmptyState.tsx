import { ReactNode } from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-7 px-4 sm:py-9 text-center ${className}`}>
      {icon && (
        <div className="w-12 h-12 rounded-full bg-pf-surface flex items-center justify-center mb-3">
          <div className="text-pf-muted">
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-base font-semibold text-pf-text mb-2">{title}</h3>
      <p className="text-sm text-pf-muted max-w-sm mb-3">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-[#032116] bg-emerald-500 rounded-lg hover:bg-emerald-400 transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
