'use client';

import { ReactNode } from 'react';

interface StickyMobileActionBarProps {
  primaryLabel: string;
  onPrimary?: () => void;
  form?: string;
  primaryType?: 'button' | 'submit';
  disabled?: boolean;
  secondary?: ReactNode;
  helperText?: string;
}

export function StickyMobileActionBar({
  primaryLabel,
  onPrimary,
  form,
  primaryType = 'button',
  disabled,
  secondary,
  helperText,
}: StickyMobileActionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-10px_25px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
      {helperText && <p className="mb-2 text-xs text-gray-500">{helperText}</p>}
      <div className="flex gap-2">
        {secondary}
        <button
          type={primaryType}
          form={form}
          onClick={onPrimary}
          disabled={disabled}
          className="flex-1 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}
