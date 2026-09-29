'use client';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
export function PasswordField({
  id = 'password',
  label = 'Password',
  value,
  onChange,
  error,
  newPassword = false,
  disabled = false,
}: {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  newPassword?: boolean;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const tooLong = new TextEncoder().encode(value).length > 72;
  const lengthHint = !value
    ? 'At least 12 characters.'
    : tooLong
      ? 'Password is too long.'
      : value.length < 12
        ? `${12 - value.length} more characters needed.`
        : 'Minimum length met.';
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          autoComplete={newPassword ? 'new-password' : 'current-password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          required
          aria-invalid={Boolean(error) || (newPassword && tooLong)}
          aria-describedby={`${id}-help`}
          className="w-full rounded-lg border border-pf-line-strong px-3 py-2.5 pr-12 text-base"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-pf-secondary"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>
      <p
        id={`${id}-help`}
        aria-live={newPassword ? 'polite' : undefined}
        className={`mt-1 text-sm ${error || (newPassword && tooLong) ? 'text-pf-danger' : 'text-pf-muted'}`}
      >
        {error || (newPassword ? lengthHint : '')}
      </p>
    </div>
  );
}
