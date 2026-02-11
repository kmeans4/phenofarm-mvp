import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'outline';
  className?: string;
}

function Badge({ children, variant = 'outline', className = '' }: BadgeProps) {
  const baseStyle = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium';
  
  const variants = {
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
    outline: 'border border-gray-300 text-gray-700',
  };

  return (
    <span className={cn(baseStyle, variants[variant], className)}>
      {children}
    </span>
  );
}

export { Badge };
