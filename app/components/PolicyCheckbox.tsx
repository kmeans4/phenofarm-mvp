'use client';
import Link from 'next/link';

export function PolicyCheckbox({ checked, onChange, disabled }: { checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return <div className="flex items-start gap-3 text-sm leading-6 text-pf-secondary">
    <input id="acceptTerms" type="checkbox" required checked={checked} onChange={event => onChange(event.target.checked)} disabled={disabled}
      className="mt-1 h-5 w-5 shrink-0 accent-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400" />
    <label htmlFor="acceptTerms" className="min-h-11 cursor-pointer">
      I agree to the <Link href="/legal/terms" target="_blank" rel="noopener" className="text-pf-accent underline underline-offset-4">Terms of Service</Link> and acknowledge the{' '}
      <Link href="/legal/privacy" target="_blank" rel="noopener" className="text-pf-accent underline underline-offset-4">Privacy Policy</Link>.
    </label>
  </div>;
}
