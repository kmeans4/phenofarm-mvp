'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-gray-900 text-gray-50 hover:bg-gray-900/80',
        secondary: 'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-100/80',
        error: 'border-transparent bg-red-500 text-gray-50 hover:bg-red-500/80',
        success: 'border-transparent bg-green-100 text-green-800',
        warning: 'border-transparent bg-yellow-100 text-yellow-800',
        info: 'border-transparent bg-blue-100 text-blue-800',
        danger: 'border-transparent bg-red-500 text-gray-50 hover:bg-red-500/80',
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
    <div className={`${badgeVariants({ variant: mappedVariant as any, className })}`}>
      {children}
    </div>
  );
}

export default {
  Badge,
  badgeVariants,
};
