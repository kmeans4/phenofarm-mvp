'use client';

import { useState, useEffect, useCallback } from 'react';
import { AddressAutocomplete } from '@/app/components/ui/AddressAutocomplete';
import { LogoUpload } from '@/app/components/settings/LogoUpload';

interface SettingsData {
  businessName: string;
  licenseNumber: string;
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
}

// Validation helpers
const validateEmail = (email: string): string | undefined => {
  if (!email) return 'Business email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return undefined;
};

const validatePhone = (phone: string): string | undefined => {
  if (!phone) return undefined; // Optional field
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 10) return 'Please enter a valid 10-digit phone number';
  if (digitsOnly.length > 11) return 'Phone number is too long';
  return undefined;
};

const validateWebsite = (website: string): string | undefined => {
  if (!website) return undefined; // Optional field
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
  if (!license.trim()) return undefined; // Optional field
  if (license.trim().length < 3) return 'License number must be at least 3 characters';
  if (license.trim().length > 50) return 'License number must be less than 50 characters';
  return undefined;
};

// Format phone number as user types
const formatPhoneNumber = (value: string): string => {
  const digitsOnly = value.replace(/\D/g, '');
  if (digitsOnly.length <= 3) return digitsOnly;
  if (digitsOnly.length <= 6) return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
  if (digitsOnly.length <= 10) return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
};

export function SettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  
  const [formData, setFormData] = useState<SettingsData>({
    businessName: '',
    licenseNumber: '',
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
  });

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const errors: FieldErrors = {
      businessName: validateBusinessName(formData.businessName),
      email: validateEmail(formData.email),
      phone: validatePhone(formData.phone),
      website: validateWebsite(formData.website),
      licenseNumber: validateLicenseNumber(formData.licenseNumber),
    };
    
    setFieldErrors(errors);
    return !Object.values(errors).some(e => e !== undefined);
  }, [formData]);

  // Validate single field
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
    }
    setFieldErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  }, []);

  // Fetch settings on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/grower/settings');
        if (res.ok) {
          const data = await res.json();
          setFormData({
            businessName: data.businessName || '',
            licenseNumber: data.licenseNumber || '',
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
          });
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

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
    setFormData(prev => ({ ...prev, logo: logoBase64 }));
    // Auto-save logo
    await handleSave(true);
  };

  const handleChange = (field: keyof SettingsData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    let value = e.target.value;
    
    // Auto-format phone numbers
    if (field === 'phone') {
      value = formatPhoneNumber(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (touched[field as keyof FieldErrors]) {
      validateField(field as keyof FieldErrors, value);
    }
  };

  const handleBlur = (field: keyof FieldErrors) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field] as string);
  };

  const handleSave = async (isLogoSave = false) => {
    // Validate all fields on save attempt
    if (!isLogoSave && !validateForm()) {
      setTouched({
        businessName: true,
        email: true,
        phone: true,
        website: true,
        licenseNumber: true,
      });
      setError('Please fix the errors above before saving.');
      return;
    }

    setSaving(true);
    setError('');
    if (!isLogoSave) setSaved(false);

    try {
      const res = await fetch('/api/grower/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      if (!isLogoSave) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global error banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {/* Success banner */}
      {saved && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Settings saved successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Logo Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Company Logo</h2>
          </div>
          <div className="p-6">
            <LogoUpload 
              currentLogo={formData.logo} 
              onUpload={handleLogoUpload} 
            />
          </div>
        </div>

        {/* Business Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
          </div>
          <div className="p-6 space-y-4">
            {/* Business Name */}
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

            {/* Contact Name */}
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

            {/* License Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business License Number <span className="text-gray-400 text-xs">(optional)</span>
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

            {/* Email */}
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
                placeholder="business@example.com"
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

            {/* Phone */}
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

            {/* Address */}
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

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input 
                type="url" 
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

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <textarea 
                rows={3}
                value={formData.description}
                onChange={handleChange('description')}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                placeholder="Tell customers about your business..."
              />
              <p className="text-xs text-gray-500 mt-1 text-right">{formData.description.length}/500</p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button 
          onClick={() => handleSave(false)}
          disabled={saving}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}
