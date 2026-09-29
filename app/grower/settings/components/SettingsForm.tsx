'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { LogoUpload } from '@/app/components/settings/LogoUpload';
import {
  CommercialTermsPanel,
  EMPTY_COMMERCIAL_TERMS,
} from '@/app/components/settings/CommercialTermsPanel';
import type { CommercialTermsDefaults } from '@/lib/ux-workflow';
import { useUnsavedChanges } from '@/app/hooks/useUnsavedChanges';
import { toast } from '@/app/hooks/useToast';
import { isLicenseExpired } from '@/lib/license';
import { US_STATES } from '@/lib/us-states';
export interface SettingsData {
  businessName: string;
  licenseNumber: string;
  licenseExpiry: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  website: string;
  description: string;
  logo: string;
}
const field =
  'mt-1 min-h-11 w-full rounded-lg border border-pf-line-strong bg-pf-raised px-3 text-base sm:text-sm';
export function SettingsForm({
  initialSettings,
  initialTerms = EMPTY_COMMERCIAL_TERMS,
  isVerified = false,
}: {
  initialSettings: SettingsData;
  initialTerms?: CommercialTermsDefaults;
  isVerified?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initialSettings);
  const [terms, setTerms] = useState(initialTerms);
  const [baseline, setBaseline] = useState({
    form: initialSettings,
    terms: initialTerms,
  });
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verification, setVerification] = useState(isVerified);
  const pending = useRef(false);
  const { setIsDirty, resetDirtyState, isDirty } = useUnsavedChanges();
  const licenseChanged =
    form.licenseNumber !== baseline.form.licenseNumber ||
    form.licenseExpiry !== baseline.form.licenseExpiry;
  useEffect(
    () =>
      setIsDirty(JSON.stringify({ form, terms }) !== JSON.stringify(baseline)),
    [form, terms, baseline, setIsDirty]
  );
  useEffect(() => {
    const focusSection = () => {
      const key = window.location.hash.slice(1);
      if (!key) return;
      const section = document.getElementById(key);
      const inputs = section?.querySelectorAll<
        HTMLInputElement | HTMLSelectElement
      >('input:not([type="file"]),select,textarea');
      const target =
        Array.from(inputs || []).find((i) => !i.value) || inputs?.[0];
      target?.focus({ preventScroll: true });
    };
    const t = setTimeout(focusSection, 150);
    window.addEventListener('hashchange', focusSection);
    return () => {
      clearTimeout(t);
      window.removeEventListener('hashchange', focusSection);
    };
  }, []);
  const change = (key: keyof SettingsData, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));
  async function save() {
    if (pending.current) return;
    const next: Record<string, string> = {};
    if (!form.businessName.trim())
      next.businessName = 'Enter the business name.';
    if (form.phone && form.phone.replace(/\D/g, '').length < 7)
      next.phone = 'Enter a valid phone number.';
    if (licenseChanged) {
      if (!form.licenseNumber.trim())
        next.licenseNumber = 'Enter the license number.';
      if (
        !form.licenseExpiry ||
        !Number.isFinite(new Date(form.licenseExpiry).getTime()) ||
        isLicenseExpired(new Date(form.licenseExpiry))
      )
        next.licenseExpiry = 'Choose today or a later expiration date.';
    }
    if (
      terms.minimumOrder &&
      (!Number.isFinite(Number(terms.minimumOrder.replace(/[$,]/g, ''))) ||
        Number(terms.minimumOrder.replace(/[$,]/g, '')) < 0)
    )
      next.terms = 'Minimum order must be a positive amount or blank.';
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(`settings-${Object.keys(next)[0]}`)?.focus();
      return;
    }
    pending.current = true;
    setBusy(true);
    try {
      const r = await fetch('/api/grower/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, commercialTerms: terms }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Could not save changes.');
      if (licenseChanged) setVerification(false);
      setBaseline({ form, terms });
      resetDirtyState();
      toast.success('Changes saved');
      router.refresh();
    } catch (e) {
      setErrors({
        form: e instanceof Error ? e.message : 'Could not save changes.',
      });
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  const renderField = (
    key: keyof SettingsData,
    label: string,
    type = 'text'
  ) => (
    <label className="block text-sm" htmlFor={`settings-${key}`}>
      {label}
      <input
        id={`settings-${key}`}
        type={type}
        value={form[key]}
        onChange={(e) => change(key, e.target.value)}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `settings-${key}-error` : undefined}
        className={field}
      />
      {errors[key] && (
        <span
          id={`settings-${key}-error`}
          className="mt-1 block text-sm text-pf-danger"
        >
          {errors[key]}
        </span>
      )}
    </label>
  );
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      {errors.form && (
        <p
          role="alert"
          className="rounded-lg bg-pf-danger-bg p-3 text-sm text-pf-danger"
        >
          {errors.form}
        </p>
      )}
      <section
        id="profile"
        className="scroll-mt-36 rounded-xl border border-pf-line bg-pf-surface p-4 sm:p-6"
      >
        <span id="business-profile" className="scroll-mt-36" />
        <h2 className="mb-4 font-semibold">Business profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {renderField('businessName', 'Business name')}
          {renderField('contactName', 'Contact name (optional)')}
          {renderField('phone', 'Phone (optional)', 'tel')}
          {renderField('website', 'Website (optional)')}
          <div className="text-sm">
            <p>Email</p>
            <p className="mt-2 break-all">{form.email}</p>
            <Link
              href="/auth/change-email"
              className="inline-flex min-h-11 items-center text-pf-accent underline"
            >
              Change email
            </Link>
          </div>
          <div className="sm:col-span-2">
            {renderField('address', 'Street address (optional)')}
          </div>
          {renderField('city', 'City (optional)')}
          <label className="text-sm" htmlFor="settings-state">
            State (optional)
            <select
              id="settings-state"
              value={form.state}
              className={field}
              onChange={(e) => change('state', e.target.value)}
            >
              <option value="">Choose state</option>
              {US_STATES.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          {renderField('zip', 'ZIP code (optional)')}
          <label
            htmlFor="settings-description"
            className="text-sm sm:col-span-2"
          >
            About your business (optional)
            <textarea
              id="settings-description"
              rows={3}
              value={form.description}
              onChange={(e) => change('description', e.target.value)}
              className={`${field} py-2`}
            />
          </label>
        </div>
      </section>
      <section
        id="license"
        className="scroll-mt-36 rounded-xl border border-pf-line bg-pf-surface p-4 sm:p-6"
      >
        <h2 className="font-semibold">License</h2>
        <p
          className={`my-3 text-sm ${verification ? 'text-pf-accent' : 'text-pf-warning'}`}
        >
          {isLicenseExpired(new Date(baseline.form.licenseExpiry))
            ? 'Expired — upload current license details.'
            : verification
              ? 'Approved'
              : baseline.form.licenseNumber && baseline.form.licenseExpiry
                ? 'Submitted — under review'
                : 'Add your license details for review.'}
        </p>
        {licenseChanged && (
          <p
            role="status"
            className="mb-3 rounded-lg bg-pf-warning-bg p-3 text-sm text-pf-warning"
          >
            Saving pauses your listings until the new license is verified.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {renderField('licenseNumber', 'License number')}
          {renderField('licenseExpiry', 'Expiration date', 'date')}
        </div>
      </section>
      <section
        id="branding"
        className="scroll-mt-36 rounded-xl border border-pf-line bg-pf-surface p-4 sm:p-6"
      >
        <h2 className="mb-4 font-semibold">Logo</h2>
        <LogoUpload
          currentLogo={form.logo}
          disabled={busy}
          onUpload={async (value) => change('logo', value)}
        />
      </section>
      {errors.terms && (
        <p role="alert" className="text-sm text-pf-danger">
          {errors.terms}
        </p>
      )}
      <CommercialTermsPanel value={terms} onChange={setTerms} disabled={busy} />
      <div className="sticky bottom-20 z-20 flex items-center justify-between gap-3 rounded-xl border border-pf-line-strong bg-pf-surface p-3 shadow-lg lg:bottom-3">
        <span className="text-sm text-pf-muted">
          {isDirty ? 'Unsaved changes' : ''}
        </span>
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
