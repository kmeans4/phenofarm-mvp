'use client';

import { BrandLogo } from '@/app/components/ui/BrandLogo';

import { useState } from 'react';
import { CURRENT_POLICIES } from '@/lib/policies/current';
import { PolicyCheckbox } from '@/app/components/PolicyCheckbox';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

const MIN_PASSWORD_LENGTH = 12;

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    businessName: '',
    businessType: 'grower',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const passwordMeetsMinimum = formData.password.length >= MIN_PASSWORD_LENGTH;
  const confirmPasswordHasValue = formData.confirmPassword.length > 0;
  const passwordsMatch = confirmPasswordHasValue && formData.password === formData.confirmPassword;
  const passwordsMismatch = confirmPasswordHasValue && formData.password !== formData.confirmPassword;
  const contactName = [formData.firstName.trim(), formData.lastName.trim()].filter(Boolean).join(' ');
  const publicBusinessName = formData.businessName.trim() || contactName;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('Please fill in all required name fields');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password || !formData.confirmPassword) {
      setError('Please enter and confirm your password');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      setError('Password must be at least 12 characters');
      return false;
    }

    if (!acceptTerms) { setError('Please agree to the Terms to continue.'); return false; }
    setError('');
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setPasswordTouched(true);
    setConfirmPasswordTouched(true);

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          businessName: publicBusinessName,
          businessType: formData.businessType,
          acceptTerms,
          termsVersion: CURRENT_POLICIES.termsVersion,
          privacyVersion: CURRENT_POLICIES.privacyVersion,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error || 'Failed to create account. Please try again.');
        setLoading(false);
        return;
      }

      router.push('/auth/verify-email?sent=1');
    } catch {
      setError('Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh bg-pf-canvas text-pf-text lg:grid lg:grid-cols-2">
      <section className="relative hidden min-h-dvh overflow-hidden bg-pf-canvas px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-18rem] h-[40rem] w-[52rem] -translate-x-1/2 rounded-full bg-emerald-500/[0.09] blur-[130px]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
          <div className="absolute bottom-0 right-0 h-px w-2/3 bg-gradient-to-r from-transparent to-emerald-400/30" />
        </div>

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas">
            <BrandLogo className="w-40" />
          </Link>
        </div>

        <div className="relative max-w-xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-pf-accent">
            Join the licensed network
          </p>
          <h1 className="text-5xl font-semibold tracking-tight text-white xl:text-6xl">
            Build your verified profile.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-pf-muted">
            One account covers grower catalog or dispensary buying workflows.
          </p>

          <div className="mt-10 grid gap-3">
            {['Marketplace identity from your business profile', 'License-aware dispensary ordering gates', 'Cultivator subscription billing only'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-pf-accent" />
                <span className="text-sm text-pf-secondary">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-pf-muted">
          Already registered?{' '}
          <Link href="/auth/sign_in" className="inline-flex min-h-10 items-center text-pf-accent transition-colors hover:text-pf-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas">
            Sign in
          </Link>
        </p>
      </section>

      <section className="flex min-h-dvh items-start justify-center px-4 py-5 sm:items-center sm:px-6 sm:py-8 lg:px-8">
        <div className="w-full max-w-2xl">
          <div className="mb-5 text-center lg:hidden">
            <Link href="/" className="mx-auto inline-flex items-center gap-3 rounded-xl text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas">
              <BrandLogo className="w-40" />
            </Link>
          </div>

          <div className="rounded-xl border border-pf-line bg-pf-surface p-4 sm:p-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-pf-text sm:text-3xl">
                Create your account
              </h2>
              <p className="mt-2 text-sm text-pf-muted">
                Already have an account?{' '}
                <Link href="/auth/sign_in" className="inline-flex min-h-10 items-center font-medium text-pf-accent transition-colors hover:text-pf-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas">
                  Sign in
                </Link>
              </p>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-xl border border-pf-danger-line bg-pf-danger-bg px-4 py-3 text-sm text-pf-danger" role="alert">
                  {error}
                </div>
              )}

              <fieldset className="min-w-0 border-t border-pf-line pt-3">
                <legend className="px-1 text-sm font-semibold text-pf-text">
                  Personal contact
                </legend>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-pf-secondary">
                      First Name *
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      inputMode="text"
                      autoCapitalize="words"
                      autoComplete="given-name"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={loading}
                      className="relative block w-full appearance-none rounded-xl border border-pf-line-strong bg-pf-surface px-3 py-2.5 text-base text-pf-text placeholder:text-pf-muted transition-colors focus:border-pf-accent focus:outline-none focus:ring-2 focus:ring-pf-accent disabled:cursor-not-allowed disabled:bg-pf-surface disabled:text-pf-muted"
                      placeholder="First name"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-pf-secondary">
                      Last Name *
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      inputMode="text"
                      autoCapitalize="words"
                      autoComplete="family-name"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      disabled={loading}
                      className="relative block w-full appearance-none rounded-xl border border-pf-line-strong bg-pf-surface px-3 py-2.5 text-base text-pf-text placeholder:text-pf-muted transition-colors focus:border-pf-accent focus:outline-none focus:ring-2 focus:ring-pf-accent disabled:cursor-not-allowed disabled:bg-pf-surface disabled:text-pf-muted"
                      placeholder="Last name"
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="min-w-0 border-t border-pf-line pt-3">
                <legend className="px-1 text-sm font-semibold text-pf-text">
                  Business profile
                </legend>
                <div className="mt-2 grid gap-3">
                  <div>
                    <label htmlFor="businessName" className="mb-1.5 block text-sm font-medium text-pf-secondary">
                      Business Name
                    </label>
                    <input
                      id="businessName"
                      name="businessName"
                      type="text"
                      autoComplete="organization"
                      value={formData.businessName}
                      onChange={handleChange}
                      disabled={loading}
                      aria-describedby="businessName-helper"
                      className="relative block w-full appearance-none rounded-xl border border-pf-line-strong bg-pf-surface px-3 py-2.5 text-base text-pf-text placeholder:text-pf-muted transition-colors focus:border-pf-accent focus:outline-none focus:ring-2 focus:ring-pf-accent disabled:cursor-not-allowed disabled:bg-pf-surface disabled:text-pf-muted"
                      placeholder="Business name"
                    />
                    <p id="businessName-helper" className="mt-2 text-xs leading-5 text-pf-muted">
                      Partners see this name. Leave blank to use your name.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="businessType" className="mb-1.5 block text-sm font-medium text-pf-secondary">
                      Business Type *
                    </label>
                    <select
                      id="businessType"
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      disabled={loading}
                      aria-describedby={formData.businessType === 'dispensary' ? 'dispensary-license-note' : undefined}
                      className="relative block w-full rounded-xl border border-pf-line-strong bg-pf-surface px-3 py-2.5 text-base text-pf-text transition-colors focus:border-pf-accent focus:outline-none focus:ring-2 focus:ring-pf-accent disabled:cursor-not-allowed disabled:bg-pf-surface disabled:text-pf-muted"
                    >
                      <option value="grower">Cannabis Grower</option>
                      <option value="dispensary">Dispensary/Retailer</option>
                    </select>
                    {formData.businessType === 'dispensary' && (
                      <p id="dispensary-license-note" className="mt-2 rounded-xl border border-pf-accent-line bg-pf-accent-bg px-3 py-2 text-xs leading-5 text-pf-accent">
                        Dispensaries submit license details after signup; ordering unlocks once PhenoShop verifies the license.
                      </p>
                    )}
                  </div>
                </div>
              </fieldset>

              <fieldset className="min-w-0 border-t border-pf-line pt-3">
                <legend className="px-1 text-sm font-semibold text-pf-text">
                  Account security
                </legend>
                <div className="mt-2 grid gap-3">
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-pf-secondary">
                      Email address *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck="false"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                      className="relative block w-full appearance-none rounded-xl border border-pf-line-strong bg-pf-surface px-3 py-2.5 text-base text-pf-text placeholder:text-pf-muted transition-colors focus:border-pf-accent focus:outline-none focus:ring-2 focus:ring-pf-accent disabled:cursor-not-allowed disabled:bg-pf-surface disabled:text-pf-muted"
                      placeholder="Email address"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-pf-secondary">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          spellCheck="false"
                          required
                          value={formData.password}
                          onChange={handleChange}
                          onBlur={() => setPasswordTouched(true)}
                          disabled={loading}
                          aria-describedby="password-strength-hint"
                          className="relative block w-full appearance-none rounded-xl border border-pf-line-strong bg-pf-surface px-3 py-2.5 pr-12 text-base text-pf-text placeholder:text-pf-muted transition-colors focus:border-pf-accent focus:outline-none focus:ring-2 focus:ring-pf-accent disabled:cursor-not-allowed disabled:bg-pf-surface disabled:text-pf-muted"
                          placeholder="Password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          disabled={loading}
                          className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-pf-muted transition-colors hover:bg-pf-hover hover:text-pf-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      <p
                        id="password-strength-hint"
                        className={`mt-2 flex items-center gap-1.5 text-xs leading-5 ${
                          (passwordTouched || formData.password.length > 0) && !passwordMeetsMinimum
                            ? 'text-pf-danger'
                            : passwordMeetsMinimum
                              ? 'text-pf-accent'
                              : 'text-pf-muted'
                        }`}
                      >
                        {passwordMeetsMinimum && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {passwordMeetsMinimum
                          ? 'Minimum length met.'
                          : `Use at least ${MIN_PASSWORD_LENGTH} characters.`}
                      </p>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-pf-secondary">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          spellCheck="false"
                          required
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          onBlur={() => setConfirmPasswordTouched(true)}
                          disabled={loading}
                          aria-describedby="password-match-hint"
                          className="relative block w-full appearance-none rounded-xl border border-pf-line-strong bg-pf-surface px-3 py-2.5 pr-12 text-base text-pf-text placeholder:text-pf-muted transition-colors focus:border-pf-accent focus:outline-none focus:ring-2 focus:ring-pf-accent disabled:cursor-not-allowed disabled:bg-pf-surface disabled:text-pf-muted"
                          placeholder="Confirm password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((current) => !current)}
                          disabled={loading}
                          className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-pf-muted transition-colors hover:bg-pf-hover hover:text-pf-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      <p
                        id="password-match-hint"
                        className={`mt-2 flex items-center gap-1.5 text-xs leading-5 ${
                          passwordsMismatch
                            ? 'text-pf-danger'
                            : passwordsMatch
                              ? 'text-pf-accent'
                              : 'text-pf-muted'
                        }`}
                      >
                        {passwordsMatch && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {passwordsMatch
                          ? 'Passwords match.'
                          : passwordsMismatch
                            ? 'Passwords do not match.'
                            : confirmPasswordTouched
                              ? 'Re-enter your password to confirm.'
                              : 'Confirm your password.'}
                      </p>
                    </div>
                  </div>
                </div>
              </fieldset>

              <PolicyCheckbox checked={acceptTerms} onChange={setAcceptTerms} disabled={loading} />

              <button
                type="submit"
                disabled={loading}
                className="group relative inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-transparent bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-pf-canvas transition-colors hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas disabled:cursor-not-allowed disabled:bg-emerald-500/70"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>

          </div>
        </div>
      </section>
    </main>
  );
}
