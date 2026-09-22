'use client';

import Link from 'next/link';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AddressAutocomplete } from '@/app/components/ui/AddressAutocomplete';
import { LogoUpload } from '@/app/components/settings/LogoUpload';
import { SignOutButton } from '@/app/components/SignOutButton';
import { useUnsavedChanges } from '@/app/hooks/useUnsavedChanges';
import { useToast } from '@/app/hooks/useToast';
import { DraftAutosaveStatus } from '@/app/components/ux/DraftAutosaveStatus';
import { StickyMobileActionBar } from '@/app/components/ux/StickyMobileActionBar';
import { useLocalDraft } from '@/app/hooks/useLocalDraft';
import { formatLicenseExpiry, isLicenseExpired } from '@/lib/license';

interface SettingsData {
  businessName: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseState: string;
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
  licenseStatus: 'pending_review' | 'verified' | 'expired' | 'rejected';
  licenseReviewNotes: string;
}

interface SettingsFormProps {
  defaultValues: SettingsData;
}

interface FieldErrors {
  businessName?: string;
  email?: string;
  phone?: string;
  website?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  licenseState?: string;
}

const validateEmail = (email: string): string | undefined => {
  if (!email) return 'Business email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return undefined;
};

const validatePhone = (phone: string): string | undefined => {
  if (!phone) return undefined;
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 10) return 'Please enter a valid 10-digit phone number';
  if (digitsOnly.length > 11) return 'Phone number is too long';
  return undefined;
};

const validateWebsite = (website: string): string | undefined => {
  if (!website) return undefined;
  const urlRegex = /^https?:\/\/.+/;
  if (!urlRegex.test(website)) return 'URL must start with http:// or https://';
  try {
    new URL(website);
    return undefined;
  } catch {
    return 'Please enter a valid URL';
  }
};

const validateBusinessName = (name: string): string | undefined => {
  if (!name.trim()) return 'Business name is required';
  if (name.trim().length < 2) return 'Business name must be at least 2 characters';
  if (name.trim().length > 100) return 'Business name must be less than 100 characters';
  return undefined;
};

const validateLicenseNumber = (license: string): string | undefined => {
  if (!license.trim()) return 'License number is required';
  if (license.trim().length < 3) return 'License number must be at least 3 characters';
  if (license.trim().length > 50) return 'License number must be less than 50 characters';
  return undefined;
};

const validateLicenseExpiry = (expiry: string): string | undefined => {
  if (!expiry) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry) || Number.isNaN(new Date(`${expiry}T12:00:00`).getTime())) return 'Invalid date format';
  if (isLicenseExpired(expiry)) return 'License expiry cannot be in the past';
  return undefined;
};

const validateLicenseState = (state: string): string | undefined => {
  if (!state.trim()) return 'License state is required';
  if (state.trim() !== 'VT') return 'Currently only VT licenses are supported';
  return undefined;
};

const formatPhoneNumber = (value: string): string => {
  const digitsOnly = value.replace(/\D/g, '');
  if (digitsOnly.length <= 3) return digitsOnly;
  if (digitsOnly.length <= 6) return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
  if (digitsOnly.length <= 10) return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
};

const LICENSE_REVIEW_WINDOW = '1-2 business days';

const sectionLinks = [
  { href: '#license-verification', label: 'License & verification' },
  { href: '#business-profile', label: 'Business profile' },
  { href: '#branding', label: 'Branding' },
];

function getLicenseStatusLabel(status: SettingsData['licenseStatus']) {
  switch (status) {
    case 'verified':
      return 'Verified';
    case 'rejected':
      return 'Rejected';
    case 'expired':
      return 'Expired';
    case 'pending_review':
    default:
      return 'Pending review';
  }
}

function getLicenseStatusTone(status: SettingsData['licenseStatus']) {
  switch (status) {
    case 'verified':
      return 'border-green-200 bg-green-50 text-green-800';
    case 'rejected':
      return 'border-orange-200 bg-orange-50 text-orange-800';
    case 'expired':
      return 'border-red-200 bg-red-50 text-red-800';
    case 'pending_review':
    default:
      return 'border-blue-200 bg-blue-50 text-blue-800';
  }
}

function getLicenseActionCopy(status: SettingsData['licenseStatus']) {
  switch (status) {
    case 'rejected':
      return `Update the license fields below using the review notes, then save. PhenoFarm reviews updates within ${LICENSE_REVIEW_WINDOW}.`;
    case 'expired':
      return `Update the license fields below with current details, then save. PhenoFarm reviews updates within ${LICENSE_REVIEW_WINDOW}.`;
    case 'pending_review':
    default:
      return `Complete the required license fields below and save. PhenoFarm reviews new dispensary licenses within ${LICENSE_REVIEW_WINDOW}.`;
  }
}

const editableDraftFields = ['businessName', 'licenseNumber', 'licenseExpiry', 'licenseState', 'contactName', 'phone', 'address', 'city', 'state', 'zip', 'website', 'description'] as const;
type SettingsDraft = Partial<Pick<SettingsData, typeof editableDraftFields[number]>>;
function editableDraft(value: unknown): SettingsDraft {
  if (!value || typeof value !== 'object') return {};
  const record = value as Record<string, unknown>;
  return Object.fromEntries(editableDraftFields.filter(key => typeof record[key] === 'string').map(key => [key, String(record[key]).slice(0, key === 'description' ? 500 : 254)]));
}

export function SettingsForm({ defaultValues }: SettingsFormProps) {
  const savingRef = useRef(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (savedTimer.current) clearTimeout(savedTimer.current); }, []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [formData, setFormData] = useState<SettingsData>(defaultValues);
  const [initialData, setInitialData] = useState<SettingsData>(defaultValues);
  const { update, showToast } = useToast();

  const { isDirty, setIsDirty, resetDirtyState } = useUnsavedChanges({
    enabled: true,
    message: 'You have unsaved changes in your settings. Are you sure you want to leave?',
  });

  const settingsDraft = useLocalDraft<SettingsDraft>({
    key: 'phenofarm:draft:dispensary-settings',
    value: editableDraft(formData),
    enabled: !loading,
    onRestore: (value) => setFormData((prev) => ({ ...prev, ...editableDraft(value) })),
    shouldSave: (value) => JSON.stringify(value) !== JSON.stringify(editableDraft(initialData)),
  });
  const clearSettingsDraft = settingsDraft.clearDraft;

  useEffect(() => {
    if (loading) return;
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);
    setIsDirty(hasChanges);
  }, [formData, initialData, loading, setIsDirty]);

  const validateForm = useCallback((): boolean => {
    const errors: FieldErrors = {
      businessName: validateBusinessName(formData.businessName),
      email: validateEmail(formData.email),
      phone: validatePhone(formData.phone),
      website: validateWebsite(formData.website),
      licenseNumber: validateLicenseNumber(formData.licenseNumber),
      licenseExpiry: validateLicenseExpiry(formData.licenseExpiry),
      licenseState: validateLicenseState(formData.licenseState),
    };

    setFieldErrors(errors);
    return !Object.values(errors).some(e => e !== undefined);
  }, [formData]);

  const validateField = useCallback((field: keyof FieldErrors, value: string) => {
    let fieldError: string | undefined;

    switch (field) {
      case 'businessName':
        fieldError = validateBusinessName(value);
        break;
      case 'email':
        fieldError = validateEmail(value);
        break;
      case 'phone':
        fieldError = validatePhone(value);
        break;
      case 'website':
        fieldError = validateWebsite(value);
        break;
      case 'licenseNumber':
        fieldError = validateLicenseNumber(value);
        break;
      case 'licenseExpiry':
        fieldError = validateLicenseExpiry(value);
        break;
      case 'licenseState':
        fieldError = validateLicenseState(value);
        break;
    }

    setFieldErrors(prev => ({ ...prev, [field]: fieldError }));
    return !fieldError;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    async function fetchSettings() {
      try {
        const res = await fetch('/api/dispensary/settings', { signal: controller.signal });
        if (!isActive) return;

        if (res.ok) {
          const data = await res.json();
          const loadedData: SettingsData = {
            businessName: data.businessName || '',
            licenseNumber: data.licenseNumber || '',
            licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry).toISOString().split('T')[0] : '',
            licenseState: data.licenseState || 'VT',
            contactName: data.contactName || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            city: data.city || '',
            state: data.state || 'VT',
            zip: data.zip || '',
            website: data.website || '',
            description: data.description || '',
            logo: data.logo || '',
            licenseStatus: data.licenseStatus || 'pending_review',
            licenseReviewNotes: data.licenseReviewNotes || '',
          };
          setFormData(loadedData);
          setInitialData(loadedData);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        if (isActive) {
          showToast('error', 'Failed to load settings');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    fetchSettings();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [showToast]);

  const handleAddressSelect = (address: {
    fullAddress: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      address: address.fullAddress,
      city: address.city,
      state: address.state,
      zip: address.zip,
    }));
  };

  const handleLogoUpload = async (url: string) => {
    if (savingRef.current) throw new Error('Wait for the current save to finish.');
    savingRef.current = true; setSaving(true);
    try {
      const response = await fetch('/api/dispensary/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logo: url }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to save logo.');
      setFormData(previous => ({ ...previous, logo: url }));
      setInitialData(previous => ({ ...previous, logo: url }));
      showToast('success', 'Logo saved');
    } finally { savingRef.current = false; setSaving(false); }
  };

  const handleChange = (field: keyof SettingsData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    let value = e.target.value;

    if (field === 'phone') {
      value = formatPhoneNumber(value);
    }

    setFormData(prev => ({ ...prev, [field]: value }));

    if (touched[field as keyof FieldErrors]) {
      validateField(field as keyof FieldErrors, value);
    }
  };

  const handleBlur = (field: keyof FieldErrors) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field] as string);
  };

  const handleSave = useCallback(async () => {
    if (savingRef.current) return;
    {
      const isValid = validateForm();
      if (!isValid) {
        setTouched({
          businessName: true,
          email: true,
          phone: true,
          website: true,
          licenseNumber: true,
          licenseExpiry: true,
          licenseState: true,
        });
        setError('Please fix the errors above before saving.');
        showToast('error', 'Please fix validation errors before saving');
        return;
      }
    }

    const payload = { ...editableDraft(formData), email: formData.email.trim().toLowerCase() };
    savingRef.current = true;

    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const itemName = 'Settings';
      await update(
        itemName,
        fetch('/api/dispensary/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then(async (res) => {
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to save');
          }
          return res.json();
        }),
        { duration: 3000 }
      );

      const latestResponse = await fetch('/api/dispensary/settings');
      const latest = latestResponse.ok ? await latestResponse.json() : null;
      const savedData = { ...formData, ...payload,
        ...(latest ? { licenseStatus: latest.licenseStatus, licenseReviewNotes: latest.licenseReviewNotes || '' } : {}) };
      setInitialData(savedData);
      setFormData(previous => {
        const editedWhileSaving = Object.fromEntries(editableDraftFields.filter(key => previous[key] !== formData[key]).map(key => [key, previous[key]]));
        return { ...savedData, ...editedWhileSaving };
      });
      clearSettingsDraft();
      resetDirtyState();

      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings';
      setError(msg);
      showToast('error', 'Failed to save', { description: msg });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [clearSettingsDraft, formData, resetDirtyState, showToast, update, validateForm]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault(); if (!saving && !loading) void handleSave();
    }
    if (event.key === 'Escape' && event.target === event.currentTarget && isDirty && !saving && window.confirm('Discard your unsaved settings changes?')) {
      setFormData(initialData); setTouched({}); setFieldErrors({}); setError(''); setIsDirty(false); clearSettingsDraft();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const licenseStatusLabel = getLicenseStatusLabel(formData.licenseStatus);
  const licenseStatusTone = getLicenseStatusTone(formData.licenseStatus);
  const isLicenseVerified = formData.licenseStatus === 'verified';
  const licenseReviewNotes = formData.licenseReviewNotes.trim();

  return (
    <div onKeyDown={handleKeyDown} tabIndex={-1} className="space-y-4 sm:space-y-6">
      {isDirty && <DraftAutosaveStatus
        savedAt={settingsDraft.savedAt}
        label="Settings browser draft"
        onClear={settingsDraft.clearDraft}
      />}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {saved && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Settings saved successfully!</span>
        </div>
      )}



      <nav className="hidden lg:sticky lg:top-4 lg:z-10 lg:flex lg:items-center lg:gap-2 rounded-lg border border-gray-200 bg-white/95 p-2 shadow-sm backdrop-blur">
        <span className="px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Sections</span>
        {sectionLinks.map((section) => (
          <a
            key={section.href}
            href={section.href}
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-green-50 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
          >
            {section.label}
          </a>
        ))}
      </nav>

      <section id="license-verification" className="scroll-mt-24 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="text-base font-semibold text-gray-900 sm:text-lg">License & verification</h2>
        </div>
        <div className="space-y-4 p-4 sm:p-6">
          {isLicenseVerified ? (
            <p className="text-sm font-medium text-green-700">
              {formData.licenseExpiry ? `Verified through ${formatLicenseExpiry(formData.licenseExpiry)}` : 'Verified · expiry not provided'}
            </p>
          ) : (
            <div className={`rounded-lg border p-4 ${licenseStatusTone}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide">Verification needed</p>
                  <h3 className="mt-1 text-lg font-semibold text-gray-900">
                    Current status: {licenseStatusLabel}
                  </h3>
                  <p className="mt-2 text-sm text-gray-700">
                    Submitting requests is blocked until PhenoFarm verifies this dispensary license.
                  </p>
                </div>
                <span className="inline-flex w-fit rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-black/10">
                  Requests locked
                </span>
              </div>
              {formData.licenseStatus === 'rejected' && licenseReviewNotes && (
                <div className="mt-4 rounded-lg border border-orange-200 bg-white/80 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-800">Review notes</p>
                  <p className="mt-1 text-sm text-gray-700">{licenseReviewNotes}</p>
                </div>
              )}
              <div className="mt-4 rounded-lg bg-white/80 p-3 text-sm text-gray-700 ring-1 ring-inset ring-black/5">
                <p className="font-medium text-gray-900">What to do next</p>
                <p className="mt-1">{getLicenseActionCopy(formData.licenseStatus)}</p>
              </div>
            </div>
          )}

          {(!formData.businessName.trim() || !formData.licenseNumber.trim() || !formData.licenseState.trim() || !formData.email.trim()) && (
            <p className="text-sm text-gray-600">Add your business name, license details, and email to complete setup.</p>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="dispensary-setting-licenseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                License number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="dispensary-setting-licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange('licenseNumber')}
                onBlur={handleBlur('licenseNumber')}
                className={`w-full rounded-lg border bg-white px-4 py-2 text-gray-900 focus:ring-1 focus:outline-none transition-colors ${
                  touched.licenseNumber && fieldErrors.licenseNumber
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
                }`}
                placeholder="License number"
              />
              {touched.licenseNumber && fieldErrors.licenseNumber && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.licenseNumber}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="dispensary-setting-licenseState" className="block text-sm font-medium text-gray-700 mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <select
                id="dispensary-setting-licenseState"
                value={formData.licenseState}
                onChange={handleChange('licenseState')}
                onBlur={handleBlur('licenseState')}
                className={`w-full rounded-lg border bg-white px-4 py-2 text-gray-900 focus:ring-1 focus:outline-none transition-colors ${
                  touched.licenseState && fieldErrors.licenseState
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
                }`}
              >
                <option value="VT">Vermont (VT)</option>
              </select>
              {touched.licenseState && fieldErrors.licenseState && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.licenseState}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="licenseExpiry" className="block text-sm font-medium text-gray-700 mb-1">
                Expiry date <span className="text-gray-400 text-xs">(recommended)</span>
              </label>
              <input
                id="licenseExpiry"
                name="licenseExpiry"
                type="date"
                value={formData.licenseExpiry}
                onChange={handleChange('licenseExpiry')}
                onBlur={handleBlur('licenseExpiry')}
                className={`w-full rounded-lg border bg-white px-4 py-2 text-gray-900 focus:ring-1 focus:outline-none transition-colors ${
                  touched.licenseExpiry && fieldErrors.licenseExpiry
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
                }`}
              />
              {touched.licenseExpiry && fieldErrors.licenseExpiry && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.licenseExpiry}
                </p>
              )}
            </div>

          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
        <div id="business-profile" className="scroll-mt-24 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Business profile</h2>
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
            <div>
              <label htmlFor="dispensary-setting-businessName" className="block text-sm font-medium text-gray-700 mb-1">
                Business name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="dispensary-setting-businessName"
                value={formData.businessName}
                onChange={handleChange('businessName')}
                onBlur={handleBlur('businessName')}
                className={`w-full rounded-lg border bg-white px-4 py-2 text-gray-900 focus:ring-1 focus:outline-none transition-colors ${
                  touched.businessName && fieldErrors.businessName
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
                }`}
                placeholder="Your business name"
              />
              {touched.businessName && fieldErrors.businessName && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.businessName}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="dispensary-setting-contactName" className="block text-sm font-medium text-gray-700 mb-1">
                Contact name <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                type="text"
                id="dispensary-setting-contactName"
                value={formData.contactName}
                onChange={handleChange('contactName')}
                placeholder="Primary contact person"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="dispensary-setting-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="dispensary-setting-email"
                value={formData.email}
                readOnly
                aria-describedby="account-email-help"
                className={`w-full rounded-lg border bg-white px-4 py-2 text-gray-900 focus:ring-1 focus:outline-none transition-colors ${
                  touched.email && fieldErrors.email
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
                }`}
                placeholder="your@email.com"
              />
              <p id="account-email-help" className="mt-1 text-sm text-gray-600">
                Verified login address. <Link href="/auth/change-email" className="inline-flex min-h-10 items-center font-medium text-green-700 underline">Change email</Link>
              </p>
              {touched.email && fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="dispensary-setting-phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                type="tel"
                id="dispensary-setting-phone"
                value={formData.phone}
                onChange={handleChange('phone')}
                onBlur={handleBlur('phone')}
                className={`w-full rounded-lg border bg-white px-4 py-2 text-gray-900 focus:ring-1 focus:outline-none transition-colors ${
                  touched.phone && fieldErrors.phone
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
                }`}
                placeholder="(555) 123-4567"
              />
              {touched.phone && fieldErrors.phone && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.phone}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="dispensary-setting-address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <AddressAutocomplete
                id="dispensary-setting-address"
                value={formData.address}
                onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
                onSelect={handleAddressSelect}
                placeholder="Start typing to search"
              />
              <p className="text-xs text-gray-500 mt-1">Type 3+ characters to find an address.</p>
            </div>

            <div>
              <label htmlFor="dispensary-setting-website" className="block text-sm font-medium text-gray-700 mb-1">
                Website <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                type="url"
                id="dispensary-setting-website"
                value={formData.website}
                onChange={handleChange('website')}
                onBlur={handleBlur('website')}
                placeholder="https://yourbusiness.com"
                className={`w-full rounded-lg border bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:ring-1 focus:outline-none transition-colors ${
                  touched.website && fieldErrors.website
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
                }`}
              />
              {touched.website && fieldErrors.website && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.website}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="dispensary-setting-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <textarea
                maxLength={500}
                rows={3}
                id="dispensary-setting-description"
                value={formData.description}
                onChange={handleChange('description')}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                placeholder="Tell growers about your business..."
              />
              <p className="text-xs text-gray-500 mt-1 text-right">{formData.description.length}/500</p>
            </div>
          </div>
        </div>

        <div id="branding" className="scroll-mt-24 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Branding</h2>
          </div>
          <div className="p-4 sm:p-6">
            <LogoUpload disabled={saving} currentLogo={formData.logo} onUpload={handleLogoUpload} />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Account</h2>
          </div>
          <div className="self-start sm:self-auto">
            <SignOutButton variant="sidebar" />
          </div>
        </div>
      </div>

      <div className="sticky bottom-4 z-20 hidden items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:flex">
        <p className="text-sm text-gray-600" role="status">{saving ? 'Saving…' : isDirty ? 'Unsaved changes' : saved ? 'Saved' : ''}</p>
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="inline-flex min-w-[9rem] items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          ) : (
            'Save settings'
          )}
        </button>
      </div>

      <StickyMobileActionBar
        primaryLabel={saving ? 'Saving...' : 'Save settings'}
        onPrimary={() => void handleSave()}
        disabled={saving}
        helperText={isDirty ? 'Unsaved changes' : saved ? 'Saved' : undefined}
      />
    </div>
  );
}
