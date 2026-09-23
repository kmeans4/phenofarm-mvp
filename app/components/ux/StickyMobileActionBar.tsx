import { ReactNode, useEffect } from 'react';

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
  useEffect(() => {
    const currentCount = Number(document.body.dataset.phenofarmStickyMobileActionBarCount || '0');
    const nextCount = currentCount + 1;

    document.body.dataset.phenofarmStickyMobileActionBarCount = String(nextCount);
    document.body.classList.add('phenofarm-has-sticky-mobile-action-bar');

    return () => {
      const updatedCount = Math.max(
        0,
        Number(document.body.dataset.phenofarmStickyMobileActionBarCount || '1') - 1
      );

      if (updatedCount === 0) {
        delete document.body.dataset.phenofarmStickyMobileActionBarCount;
        document.body.classList.remove('phenofarm-has-sticky-mobile-action-bar');
      } else {
        document.body.dataset.phenofarmStickyMobileActionBarCount = String(updatedCount);
      }
    };
  }, []);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-10px_25px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
      {helperText && <p className="mb-2 text-xs text-gray-500">{helperText}</p>}
      <div className={secondary ? 'grid grid-cols-2 gap-2' : 'flex'}>
        {secondary}
        <button
          type={primaryType}
          form={form}
          onClick={onPrimary}
          disabled={disabled}
          className="min-w-0 flex-1 rounded-lg bg-green-600 px-3 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}
