'use client';

import { useState, useEffect, useCallback } from 'react';
import { AddressAutocomplete } from '@/app/components/ui/AddressAutocomplete';
import { LogoUpload } from '@/app/components/settings/LogoUpload';
import { SignOutButton } from '@/app/components/SignOutButton';
import { useUnsavedChanges } from '@/app/hooks/useUnsavedChanges';
import { useToast } from '@/app/hooks/useToast';
import { DraftAutosaveStatus } from '@/app/components/ux/DraftAutosaveStatus';
import { StickyMobileActionBar } from '@/app/components/ux/StickyMobileActionBar';
import { useLocalDraft } from '@/app/hooks/useLocalDraft';

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
  const expiryDate = new Date(expiry);
  const now = new Date();
  if (isNaN(expiryDate.getTime())) return 'Invalid date format';
  if (expiryDate < now) return 'License expiry must be in the future';
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

export function SettingsForm({ defaultValues }: SettingsFormProps) {
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

  const settingsDraft = useLocalDraft<SettingsData>({
    key: 'phenofarm:draft:dispensary-settings',
    value: formData,
    enabled: !loading,
    onRestore: (value) => setFormData((prev) => ({ ...prev, ...value })),
    shouldSave: (value) => JSON.stringify(value) !== JSON.stringify(initialData),
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

  const handleLogoUpload = async (logoBase64: string) => {
    const nextData = { ...formData, logo: logoBase64 };
    setFormData(nextData);
    await handleSave(true, nextData);
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

  const handleSave = useCallback(async (isLogoSave = false, dataOverride?: SettingsData) => {
    if (!isLogoSave) {
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

    const payload = dataOverride ?? formData;

    setSaving(true);
    setError('');
    if (!isLogoSave) setSaved(false);

    try {
      const itemName = isLogoSave ? 'Logo' : 'Settings';
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

      setInitialData(payload);
      clearSettingsDraft();
      resetDirtyState();

      if (!isLogoSave) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings';
      setError(msg);
      showToast('error', 'Failed to save', { description: msg });
    } finally {
      setSaving(false);
    }
  }, [clearSettingsDraft, formData, resetDirtyState, showToast, update, validateForm]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!saving && !loading) {
          handleSave(false);
        }
      }

      if (e.key === 'Escape' && !loading) {
        setFormData(initialData);
        setTouched({});
        setFieldErrors({});
        setError('');
        setIsDirty(false);
        showToast('info', 'Changes discarded');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, saving, loading, initialData, setIsDirty, showToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-gray-600 font-mono">Ctrl</kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-gray-600 font-mono">S</kbd>
          <span className="ml-1">to save</span>
        </span>
        <span className="text-gray-300">|</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-gray-600 font-mono">Esc</kbd>
          <span className="ml-1">to cancel</span>
        </span>
      </div>

      <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-green-800">Required first</p>
        <p className="mt-1 text-sm text-green-900">
          Finish business name, license state, license number, and email first. Expiry, logo, address, website, and description can be completed later.
        </p>
      </div>

      <DraftAutosaveStatus
        savedAt={settingsDraft.savedAt}
        label="Settings browser draft"
        onClear={settingsDraft.clearDraft}
      />

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

      {isDirty && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>You have unsaved changes. Don&apos;t forget to save before leaving.</span>
        </div>
      )}

      {formData.licenseStatus && (
        <div className={`p-4 border rounded-lg flex items-start gap-3 ${
          formData.licenseStatus === 'verified'
            ? 'bg-green-50 border-green-200 text-green-700'
            : formData.licenseStatus === 'pending_review'
            ? 'bg-blue-50 border-blue-200 text-blue-700'
            : formData.licenseStatus === 'expired'
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-orange-50 border-orange-200 text-orange-700'
        }`}>
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-medium">
              {formData.licenseStatus === 'verified' && 'License Verified'}
              {formData.licenseStatus === 'pending_review' && 'License Pending Review'}
              {formData.licenseStatus === 'expired' && 'License Expired'}
              {formData.licenseStatus === 'rejected' && 'License Rejected'}
            </p>
            <p className="text-sm mt-1">
              {formData.licenseStatus === 'verified' && (formData.licenseExpiry
                ? `Your license is verified through ${new Date(formData.licenseExpiry).toLocaleDateString()}.`
                : 'Your license is verified. No expiry date is currently on file.')}
              {formData.licenseStatus === 'pending_review' && 'Your license is being reviewed by our team. You will be notified once verified.'}
              {formData.licenseStatus === 'expired' && 'Your license has expired. Please update your license information.'}
              {formData.licenseStatus === 'rejected' && 'Your license was rejected. Please contact support for more information.'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Company Logo</h2>
          </div>
          <div className="p-4 sm:p-6">
            <LogoUpload currentLogo={formData.logo} onUpload={handleLogoUpload} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Business Information</h2>
          </div>
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={handleChange('contactName')}
                placeholder="Primary contact person"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dispensary License Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License State <span className="text-red-500">*</span>
              </label>
              <select
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
                License Expiry Date <span className="text-gray-400 text-xs">(recommended)</span>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                onBlur={handleBlur('email')}
                className={`w-full rounded-lg border bg-white px-4 py-2 text-gray-900 focus:ring-1 focus:outline-none transition-colors ${
                  touched.email && fieldErrors.email
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
                }`}
                placeholder="your@email.com"
              />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Phone <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                type="tel"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Address <span className="text-green-600 text-xs font-medium">(Autocomplete)</span>
              </label>
              <AddressAutocomplete
                value={formData.address}
                onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
                onSelect={handleAddressSelect}
                placeholder="Type your address..."
              />
              <p className="text-xs text-gray-500 mt-1">Type 3+ characters to see suggestions (includes city, state, ZIP)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                type="url"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Description <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={handleChange('description')}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                placeholder="Tell growers about your business..."
              />
              <p className="text-xs text-gray-500 mt-1 text-right">{formData.description.length}/500</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Account</h2>
            <p className="mt-1 text-sm text-gray-600">Sign out of your dispensary account from this device.</p>
          </div>
          <div className="self-start sm:self-auto">
            <SignOutButton />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2 sm:pt-4">
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="w-full sm:w-auto bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
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
            'Save Changes'
          )}
        </button>
      </div>

      <StickyMobileActionBar
        primaryLabel={saving ? 'Saving...' : 'Save settings'}
        onPrimary={() => void handleSave(false)}
        disabled={saving}
        helperText="Settings drafts save in this browser."
      />
    </div>
  );
}
