'use client';

import Link from 'next/link';

import { isLicenseExpired } from '@/lib/license';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AddressAutocomplete } from '@/app/components/ui/AddressAutocomplete';
import { Button } from '@/app/components/ui/Button';
import { LogoUpload } from '@/app/components/settings/LogoUpload';
import { useUnsavedChanges } from '@/app/hooks/useUnsavedChanges';
import { useToast } from '@/app/hooks/useToast';
import { DraftAutosaveStatus } from '@/app/components/ux/DraftAutosaveStatus';
import { StickyMobileActionBar } from '@/app/components/ux/StickyMobileActionBar';
import { useKeyboardShortcuts } from '@/app/hooks/useKeyboardShortcuts';
import { useLocalDraft } from '@/app/hooks/useLocalDraft';

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

interface FieldErrors {
  businessName?: string;
  email?: string;
  phone?: string;
  website?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
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
  if (!license.trim()) return undefined;
  if (license.trim().length < 3) return 'License number must be at least 3 characters';
  if (license.trim().length > 50) return 'License number must be less than 50 characters';
  return undefined;
};

const validateLicenseExpiry = (expiry: string): string | undefined => {
  if (!expiry) return 'License expiry date is required';
  const expiryDate = new Date(expiry);
  if (isNaN(expiryDate.getTime())) return 'Invalid date format';
  if (isLicenseExpired(expiryDate)) return 'License expiry must be today or later';
  return undefined;
};

const formatPhoneNumber = (value: string): string => {
  const digitsOnly = value.replace(/\D/g, '');
  if (digitsOnly.length <= 3) return digitsOnly;
  if (digitsOnly.length <= 6) return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
  if (digitsOnly.length <= 10) return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
};

const DEFAULT_FORM_DATA: SettingsData = {
  businessName: '',
  licenseNumber: '',
  licenseExpiry: '',
  contactName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: 'VT',
  zip: '',
  website: '',
  description: '',
  logo: '',
};

export function SettingsForm({ initialSettings }: { initialSettings?: SettingsData }) {
  const [loading, setLoading] = useState(!initialSettings);
  const pendingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  
  const [formData, setFormData] = useState<SettingsData>(initialSettings || DEFAULT_FORM_DATA);
  const [initialData, setInitialData] = useState<SettingsData>(initialSettings || DEFAULT_FORM_DATA);
  
  const { update, showToast } = useToast();
  
  const { isDirty, setIsDirty, resetDirtyState } = useUnsavedChanges({
    enabled: true,
    message: 'You have unsaved changes in your settings. Are you sure you want to leave?',
  });

  const draftValue = useMemo(() => {
    const value = { ...formData };
    delete (value as Partial<SettingsData>).logo;
    delete (value as Partial<SettingsData>).email;
    return value as Omit<SettingsData, 'logo' | 'email'>;
  }, [formData]);
  const settingsDraft = useLocalDraft<Omit<SettingsData, 'logo' | 'email'>>({
    key: 'phenofarm:draft:grower-settings',
    value: draftValue,
    enabled: !loading,
    onRestore: (value) => setFormData((prev) => ({ ...prev, ...value, logo: prev.logo, email: prev.email })),
    shouldSave: () => isDirty,
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
    };
    
    setFieldErrors(errors);
    return !Object.values(errors).some(e => e !== undefined);
  }, [formData]);

  const validateField = useCallback((field: keyof FieldErrors, value: string) => {
    let error: string | undefined;
    switch (field) {
      case 'businessName':
        error = validateBusinessName(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'phone':
        error = validatePhone(value);
        break;
      case 'website':
        error = validateWebsite(value);
        break;
      case 'licenseNumber':
        error = validateLicenseNumber(value);
        break;
      case 'licenseExpiry':
        error = validateLicenseExpiry(value);
        break;
    }
    setFieldErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  }, []);

  useEffect(() => {
    if (initialSettings) return;
    const controller = new AbortController();
    let isMounted = true;

    async function fetchSettings() {
      try {
        const res = await fetch('/api/grower/settings', { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          const loadedData: SettingsData = {
            businessName: data.businessName || '',
            licenseNumber: data.licenseNumber || '',
            licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry).toISOString().split('T')[0] : '',
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
          };
          if (!isMounted) return;
          setFormData(loadedData);
          setInitialData(loadedData);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Failed to load settings:', err);
        showToast('error', 'Failed to load settings');
      } finally {
        if (isMounted && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    }
    fetchSettings();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [initialSettings, showToast]);

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

  const handleLogoUpload = async (logo: string) => {
    if (pendingRef.current) throw new Error('Wait for your current save to finish.');
    pendingRef.current = true;
    setSaving(true);
    try {
      const response = await fetch('/api/grower/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logo }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not save logo.');
      const savedLogo = typeof data.logo === 'string' ? data.logo : logo;
      setFormData((current) => ({ ...current, logo: savedLogo }));
      setInitialData((current) => ({ ...current, logo: savedLogo }));
      showToast('success', 'Logo saved');
    } finally { pendingRef.current = false; setSaving(false); }
  };

  const handleChange = (field: keyof SettingsData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
    if (pendingRef.current) return;
    if (!validateForm()) {
      setTouched({ businessName: true, email: true, phone: true, website: true, licenseNumber: true, licenseExpiry: true });
      setError('Please fix the errors above before saving.');
      return;
    }
    pendingRef.current = true;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await update('Settings', fetch('/api/grower/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftValue),
      }).then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to save settings.');
        return data;
      }), { duration: 3000 });
      setInitialData(formData);
      clearSettingsDraft();
      resetDirtyState();
      setSaved(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save settings.'); }
    finally { pendingRef.current = false; setSaving(false); }
  }, [clearSettingsDraft, draftValue, formData, resetDirtyState, update, validateForm]);

  useEffect(() => {
    if (!saved) return;
    const timeout = window.setTimeout(() => setSaved(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [saved]);
  useKeyboardShortcuts({ onSave: handleSave, isDirty, enabled: !loading && !saving });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
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

      <div className="space-y-4">
        <div id="business-profile" className="scroll-mt-36 lg:scroll-mt-20 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Business profile</h2>
          </div>
          <div className="grid gap-3 p-4 sm:gap-4 sm:p-6 md:grid-cols-2">
            <p className="text-xs text-gray-500 md:col-span-2">* Required</p>

            <div>
              <label htmlFor="profile-businessName" className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                id="profile-businessName"
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
              <label htmlFor="profile-contactName" className="block text-sm font-medium text-gray-700 mb-1">
                Contact
              </label>
              <input 
                type="text" 
                id="profile-contactName"
                value={formData.contactName}
                onChange={handleChange('contactName')}
                placeholder="Primary contact person"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="profile-licenseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                License number <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                id="profile-licenseNumber"
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
              <label htmlFor="profile-licenseExpiry" className="block text-sm font-medium text-gray-700 mb-1">
                License expiry <span className="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                id="profile-licenseExpiry"
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
              <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input 
                type="email" 
                id="profile-email"
                value={formData.email}
                readOnly
                aria-describedby="account-email-help"
                className={`w-full rounded-lg border bg-white px-4 py-2 text-gray-900 focus:ring-1 focus:outline-none transition-colors ${
                  touched.email && fieldErrors.email
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
                }`}
                placeholder="business@example.com"
              />
              <p id="account-email-help" className="mt-1 text-sm text-gray-600">
                Login address. <Link href="/auth/change-email" className="inline-flex min-h-10 items-center font-medium text-green-700 underline">Change email</Link>
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
              <label htmlFor="profile-phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input 
                type="tel" 
                id="profile-phone"
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
              <label htmlFor="profile-address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <AddressAutocomplete
                id="profile-address"
                value={formData.address}
                onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
                onSelect={handleAddressSelect}
                placeholder="Type your address..."
              />
              <p className="text-xs text-gray-500 mt-1">Includes city, state and ZIP.</p>
            </div>

            <div>
              <label htmlFor="profile-website" className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input 
                type="url" 
                id="profile-website"
                value={formData.website}
                onChange={handleChange('website')}
                onBlur={handleBlur('website')}
                className={`w-full rounded-lg border bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:ring-1 focus:outline-none transition-colors ${
                  touched.website && fieldErrors.website
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
                }`}
                placeholder="https://yourbusiness.com"
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

            <div className="md:col-span-2">
              <label htmlFor="profile-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea 
                rows={2}
                id="profile-description"
                value={formData.description}
                onChange={handleChange('description')}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                placeholder="Tell customers about your business..."
              />
              <p className="text-xs text-gray-500 mt-1 text-right">{formData.description.length}/500</p>
            </div>
          </div>
        </div>

        <div id="branding" className="self-start scroll-mt-36 lg:scroll-mt-20 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Logo</h2>
          </div>
          <div className="p-4 sm:p-6">
            <LogoUpload
              currentLogo={formData.logo}
              onUpload={handleLogoUpload}
              disabled={saving}
            />
          </div>
        </div>
      </div>

      {isDirty && <div className="sticky bottom-4 z-20 hidden items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:flex">
        <p className="text-sm text-gray-600">Unsaved profile changes</p>
        <Button
          type="button"
          variant="primary"
          onClick={() => handleSave()}
          disabled={saving}
          className="min-w-[9rem]"
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
            'Save profile'
          )}
        </Button>
      </div>}

      {isDirty && <StickyMobileActionBar
        primaryLabel={saving ? 'Saving...' : 'Save profile'}
        onPrimary={() => void handleSave()}
        disabled={saving}
        helperText="Unsaved profile changes"
      />}
    </div>
  );
}
