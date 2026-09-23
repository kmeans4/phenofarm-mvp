'use client';

import { useState } from 'react';
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
    <main className="min-h-screen bg-[#070908] text-gray-900 lg:grid lg:grid-cols-2">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#070908] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-18rem] h-[40rem] w-[52rem] -translate-x-1/2 rounded-full bg-emerald-500/[0.09] blur-[130px]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
          <div className="absolute bottom-0 right-0 h-px w-2/3 bg-gradient-to-r from-transparent to-emerald-400/30" />
        </div>

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070908]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-white shadow-[0_0_24px_rgba(16,185,129,0.35)]">
              PF
            </span>
            <span className="text-lg font-semibold tracking-tight">PhenoFarm</span>
          </Link>
        </div>

        <div className="relative max-w-xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
            Join the licensed network
          </p>
          <h1 className="text-5xl font-semibold tracking-tight text-white xl:text-6xl">
            Build your verified profile.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-gray-400">
            One account covers grower catalog or dispensary buying workflows.
          </p>

          <div className="mt-10 grid gap-3">
            {['Marketplace identity from your business profile', 'License-aware dispensary ordering gates', 'Cultivator subscription billing only'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" />
                <span className="text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-gray-500">
          Already registered?{' '}
          <Link href="/auth/sign_in" className="inline-flex min-h-10 items-center text-emerald-300 transition-colors hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070908]">
            Sign in
          </Link>
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:bg-gray-50 lg:px-8">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center lg:hidden">
            <Link href="/" className="mx-auto inline-flex items-center gap-3 rounded-xl text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070908]">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-lg font-bold text-white shadow-[0_0_24px_rgba(16,185,129,0.35)]">
                PF
              </span>
              <span className="text-lg font-semibold">PhenoFarm</span>
            </Link>
          </div>

          <div className="rounded-3xl border border-white/[0.08] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8 lg:border-gray-200 lg:shadow-sm">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-950">
                Create your account
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/sign_in" className="inline-flex min-h-10 items-center font-medium text-green-700 transition-colors hover:text-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2">
                  Sign in
                </Link>
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {error}
                </div>
              )}

              <fieldset className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5">
                <legend className="px-1 text-sm font-semibold text-gray-950">
                  Personal contact
                </legend>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-gray-700">
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
                      className="relative block w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-500 transition-colors focus:z-10 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder="First name"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-gray-700">
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
                      className="relative block w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-500 transition-colors focus:z-10 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder="Last name"
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5">
                <legend className="px-1 text-sm font-semibold text-gray-950">
                  Business profile
                </legend>
                <div className="mt-3 grid gap-4">
                  <div>
                    <label htmlFor="businessName" className="mb-2 block text-sm font-medium text-gray-700">
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
                      className="relative block w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-500 transition-colors focus:z-10 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder="Business name"
                    />
                    <p id="businessName-helper" className="mt-2 text-xs leading-5 text-gray-500">
                      Shown to marketplace partners — defaults to your name if left blank.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="businessType" className="mb-2 block text-sm font-medium text-gray-700">
                      Business Type *
                    </label>
                    <select
                      id="businessType"
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      disabled={loading}
                      aria-describedby={formData.businessType === 'dispensary' ? 'dispensary-license-note' : undefined}
                      className="relative block w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 transition-colors focus:z-10 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="grower">Cannabis Grower</option>
                      <option value="dispensary">Dispensary/Retailer</option>
                    </select>
                    {formData.businessType === 'dispensary' && (
                      <p id="dispensary-license-note" className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-900">
                        Dispensaries submit license details after signup; ordering unlocks once PhenoFarm verifies the license.
                      </p>
                    )}
                  </div>
                </div>
              </fieldset>

              <fieldset className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5">
                <legend className="px-1 text-sm font-semibold text-gray-950">
                  Account security
                </legend>
                <div className="mt-3 grid gap-4">
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
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
                      className="relative block w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-500 transition-colors focus:z-10 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder="Email address"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
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
                          className="relative block w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 text-base text-gray-900 placeholder:text-gray-500 transition-colors focus:z-10 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                          placeholder="Password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          disabled={loading}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      <p
                        id="password-strength-hint"
                        className={`mt-2 flex items-center gap-1.5 text-xs leading-5 ${
                          (passwordTouched || formData.password.length > 0) && !passwordMeetsMinimum
                            ? 'text-red-700'
                            : passwordMeetsMinimum
                              ? 'text-green-700'
                              : 'text-gray-500'
                        }`}
                      >
                        {passwordMeetsMinimum && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {passwordMeetsMinimum
                          ? 'Password meets the minimum length.'
                          : `Use at least ${MIN_PASSWORD_LENGTH} characters.`}
                      </p>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">
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
                          className="relative block w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 text-base text-gray-900 placeholder:text-gray-500 transition-colors focus:z-10 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                          placeholder="Confirm password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((current) => !current)}
                          disabled={loading}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      <p
                        id="password-match-hint"
                        className={`mt-2 flex items-center gap-1.5 text-xs leading-5 ${
                          passwordsMismatch
                            ? 'text-red-700'
                            : passwordsMatch
                              ? 'text-green-700'
                              : 'text-gray-500'
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

              <button
                type="submit"
                disabled={loading}
                className="group relative inline-flex w-full items-center justify-center gap-2 rounded-xl border border-transparent bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-green-700/70"
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

            <div className="mt-6 border-t border-gray-200 pt-5 text-center text-sm text-gray-500">
              By signing up, you agree to the{' '}
              <Link href="/legal/terms" className="inline-flex min-h-10 items-center font-medium text-gray-700 transition-colors hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/legal/privacy" className="inline-flex min-h-10 items-center font-medium text-gray-700 transition-colors hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2">
                Privacy Policy
              </Link>
              .
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
