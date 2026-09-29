'use client';
import { Slot } from '@radix-ui/react-slot';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-emerald-500 text-[#032116] hover:bg-emerald-400',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        outline:
          'border border-pf-line-strong bg-pf-surface text-pf-text shadow-sm hover:bg-pf-surface hover:text-pf-text',
        secondary:
          'border border-pf-line-strong bg-pf-surface text-pf-text hover:bg-pf-surface/80',
        ghost: 'hover:bg-pf-surface hover:text-pf-text',
        link: 'text-pf-text underline-offset-4 hover:underline',
        primary: 'bg-emerald-500 text-[#032116] shadow-sm hover:bg-emerald-400',
      },
      size: {
        default: 'min-h-11 px-4 py-2',
        sm: 'min-h-11 rounded-lg px-3',
        lg: 'h-11 rounded-lg px-8',
        icon: 'h-11 w-11',
        touch: 'min-h-11 min-w-11 px-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

const ui = {
  Button,
  buttonVariants,
};

export default ui;
