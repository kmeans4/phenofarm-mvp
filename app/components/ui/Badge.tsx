import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-pf-canvas',
  {
    variants: {
      variant: {
        default: 'border-pf-line bg-pf-raised text-pf-secondary',
        secondary: 'border-transparent bg-pf-surface text-pf-text hover:bg-pf-surface/80',
        error: 'border-pf-danger-line bg-pf-danger-bg text-pf-danger',
        success: 'border-transparent bg-pf-accent-bg text-pf-accent',
        warning: 'border-transparent bg-pf-warning-bg text-pf-warning',
        info: 'border-transparent bg-pf-info-bg text-pf-info',
        danger: 'border-pf-danger-line bg-pf-danger-bg text-pf-danger',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export function Badge({ className, variant, children }: BadgeProps) {
  // Type assertion to handle variant mapping at runtime
  const variantStr = variant as string;
  const mappedVariant = variantStr === 'danger' ? 'error' : variantStr;
  return (
    <div className={`${badgeVariants({ variant: mappedVariant as "default" | "secondary" | "error" | "success" | "warning" | "info" | "danger", className })}`}>
      {children}
    </div>
  );
}

const ui = {
  Badge,
  badgeVariants,
};

export default ui;
