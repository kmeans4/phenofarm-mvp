'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CURRENT_POLICIES } from '@/lib/policies/current';
import { PolicyCheckbox } from '@/app/components/PolicyCheckbox';
import { AccountAccessCard } from '../components/AccountAccessCard';
import { PasswordField } from '../components/PasswordField';

export default function SignUpPage() {
  const router = useRouter();
  const [values, setValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    businessName: '',
    businessType: '',
  });
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const type = new URLSearchParams(window.location.search).get('type');
    if (type === 'grower' || type === 'dispensary')
      setValues((current) => ({ ...current, businessType: type }));
  }, []);
  const validate = () => {
    const next: Record<string, string> = {};
    if (!values.businessType)
      next.businessType = 'Choose Grower or Dispensary.';
    if (!values.businessName.trim())
      next.businessName = 'Enter your business name.';
    if (!values.firstName.trim()) next.firstName = 'Enter your first name.';
    if (!values.lastName.trim()) next.lastName = 'Enter your last name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      next.email = 'Enter a valid email.';
    if (
      values.password.length < 12 ||
      new TextEncoder().encode(values.password).length > 72
    )
      next.password = 'Use at least 12 characters (up to 72 bytes).';
    if (!accepted) next.acceptTerms = 'Agree to the Terms to continue.';
    return next;
  };
  const update = (key: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(Object.keys(next)[0])?.focus();
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          acceptTerms: accepted,
          termsVersion: CURRENT_POLICIES.termsVersion,
          privacyVersion: CURRENT_POLICIES.privacyVersion,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(
          data?.error || 'Could not create your account. Try again.'
        );
      try {
        sessionStorage.setItem(
          'phenoshop:verification-email',
          values.email.trim()
        );
      } catch {}
      router.push('/auth/verify-email?sent=1');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not connect. Try again.'
      );
      setBusy(false);
    }
  }
  return (
    <AccountAccessCard
      title="Create your account"
      description="Add your license after verifying your email."
    >
      <form noValidate onSubmit={submit} className="space-y-4">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">I’m a…</legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['grower', 'Grower', 'List products'],
              ['dispensary', 'Dispensary', 'Browse and order'],
            ].map(([value, label, hint]) => (
              <label
                key={value}
                className={`flex min-h-20 cursor-pointer gap-2 rounded-xl border p-3 ${values.businessType === value ? 'border-pf-accent bg-pf-accent-bg' : 'border-pf-line-strong'}`}
              >
                <input
                  id={value === 'grower' ? 'businessType' : undefined}
                  type="radio"
                  name="businessType"
                  value={value}
                  checked={values.businessType === value}
                  onChange={() => update('businessType', value)}
                  aria-describedby="businessType-error"
                />
                <span>
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="text-sm text-pf-muted">{hint}</span>
                </span>
              </label>
            ))}
          </div>
          {errors.businessType && (
            <p id="businessType-error" className="mt-1 text-sm text-pf-danger">
              {errors.businessType}
            </p>
          )}
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          {(['firstName', 'lastName', 'businessName', 'email'] as const).map(
            (key) => (
              <div
                key={key}
                className={
                  ['businessName', 'email'].includes(key) ? 'col-span-2' : ''
                }
              >
                <label htmlFor={key} className="mb-1 block text-sm font-medium">
                  {
                    {
                      firstName: 'First name',
                      lastName: 'Last name',
                      businessName: 'Business name',
                      email: 'Email',
                    }[key]
                  }
                </label>
                <input
                  id={key}
                  name={key}
                  type={key === 'email' ? 'email' : 'text'}
                  autoComplete={
                    {
                      firstName: 'given-name',
                      lastName: 'family-name',
                      businessName: 'organization',
                      email: 'email',
                    }[key]
                  }
                  value={values[key]}
                  onChange={(event) => update(key, event.target.value)}
                  onBlur={() =>
                    setErrors((current) => ({
                      ...current,
                      [key]: validate()[key] || '',
                    }))
                  }
                  required
                  aria-invalid={Boolean(errors[key])}
                  aria-describedby={errors[key] ? `${key}-error` : undefined}
                  className="w-full rounded-lg border border-pf-line-strong px-3 py-2.5 text-base"
                />
                {errors[key] && (
                  <p
                    id={`${key}-error`}
                    className="mt-1 text-sm text-pf-danger"
                  >
                    {errors[key]}
                  </p>
                )}
              </div>
            )
          )}
        </div>
        <PasswordField
          newPassword
          value={values.password}
          onChange={(value) => update('password', value)}
          error={errors.password}
          disabled={busy}
        />
        <PolicyCheckbox
          checked={accepted}
          onChange={setAccepted}
          disabled={busy}
          error={errors.acceptTerms}
        />
        {error && (
          <p role="alert" className="text-sm text-pf-danger">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="min-h-11 w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-pf-canvas"
        >
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p className="text-sm text-pf-secondary">
          Already have an account?{' '}
          <Link
            className="inline-flex min-h-11 items-center text-pf-accent underline"
            href="/auth/sign_in"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AccountAccessCard>
  );
}
