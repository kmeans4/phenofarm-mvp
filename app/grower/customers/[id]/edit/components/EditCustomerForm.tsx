'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUnsavedChanges } from '@/app/hooks/useUnsavedChanges';
import { useToast } from '@/app/hooks/useToast';

interface Customer {
  id: string;
  businessName: string;
  licenseNumber: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  website: string | null;
  description: string | null;
  email?: string;
  contactName?: string;
}

interface FieldErrors {
  businessName?: string;
  email?: string;
  phone?: string;
  website?: string;
  zipCode?: string;
  licenseNumber?: string;
  description?: string;
}

const US_STATES = [
  { code: 'VT', name: 'Vermont' },
  { code: 'ME', name: 'Maine' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NY', name: 'New York' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'DE', name: 'Delaware' },
  { code: 'MD', name: 'Maryland' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'VA', name: 'Virginia' },
];

// Validation functions
const validateBusinessName = (name: string): string | undefined => {
  if (!name.trim()) return 'Business name is required';
  if (name.trim().length < 2) return 'Business name must be at least 2 characters';
  if (name.trim().length > 100) return 'Business name must be less than 100 characters';
  return undefined;
};

const validateEmail = (email: string): string | undefined => {
  if (!email) return undefined;
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

const validateZipCode = (zip: string): string | undefined => {
  if (!zip) return undefined;
  const zipRegex = /^\d{5}(-\d{4})?$/;
  if (!zipRegex.test(zip)) return 'Please enter a valid ZIP code (12345 or 12345-6789)';
  return undefined;
};

const validateLicenseNumber = (license: string): string | undefined => {
  if (!license.trim()) return undefined;
  if (license.trim().length < 3) return 'License number must be at least 3 characters';
  if (license.trim().length > 50) return 'License number must be less than 50 characters';
  return undefined;
};

const validateDescription = (desc: string): string | undefined => {
  if (!desc) return undefined;
  if (desc.length > 500) return 'Description must be less than 500 characters';
  return undefined;
};

const formatPhoneNumber = (value: string): string => {
  const digitsOnly = value.replace(/\D/g, '');
  if (digitsOnly.length <= 3) return digitsOnly;
  if (digitsOnly.length <= 6) return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
  if (digitsOnly.length <= 10) return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
};

const INPUT_CLASSES = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent";
const INPUT_ERROR_CLASSES = "w-full px-3 py-2 border border-red-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-red-50";

export default function EditCustomerForm({ customer }: { customer: Customer }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    businessName: customer.businessName || '',
    contactName: customer.contactName || '',
    email: customer.email || '',
    phone: customer.phone || '',
    licenseNumber: customer.licenseNumber || '',
    address: customer.address || '',
    city: customer.city || '',
    state: customer.state || 'VT',
    zipCode: customer.zip || '',
    website: customer.website || '',
    description: customer.description || '',
  });
  
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialData = {
    businessName: customer.businessName || '',
    contactName: customer.contactName || '',
    email: customer.email || '',
    phone: customer.phone || '',
    licenseNumber: customer.licenseNumber || '',
    address: customer.address || '',
    city: customer.city || '',
    state: customer.state || 'VT',
    zipCode: customer.zip || '',
    website: customer.website || '',
    description: customer.description || '',
  };

  const { isDirty, setIsDirty, resetDirtyState } = useUnsavedChanges({
    enabled: true,
    message: 'You have unsaved changes in this customer. Are you sure you want to leave?',
  });

  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);
    setIsDirty(hasChanges);
  }, [formData, setIsDirty]);

  const validateForm = (): boolean => {
    const newErrors: FieldErrors = {
      businessName: validateBusinessName(formData.businessName),
      email: validateEmail(formData.email),
      phone: validatePhone(formData.phone),
      website: validateWebsite(formData.website),
      zipCode: validateZipCode(formData.zipCode),
      licenseNumber: validateLicenseNumber(formData.licenseNumber),
      description: validateDescription(formData.description),
    };
    
    Object.keys(newErrors).forEach(key => {
      if (newErrors[key as keyof FieldErrors] === undefined) {
        delete newErrors[key as keyof FieldErrors];
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateField = (field: keyof FieldErrors, value: string): string | undefined => {
    switch (field) {
      case 'businessName': return validateBusinessName(value);
      case 'email': return validateEmail(value);
      case 'phone': return validatePhone(value);
      case 'website': return validateWebsite(value);
      case 'zipCode': return validateZipCode(value);
      case 'licenseNumber': return validateLicenseNumber(value);
      case 'description': return validateDescription(value);
      default: return undefined;
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (touched[field]) {
      const error = validateField(field as keyof FieldErrors, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field: keyof FieldErrors) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = formData[field as keyof typeof formData];
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData(prev => ({ ...prev, phone: formatted }));
    if (touched.phone) {
      const error = validatePhone(formatted);
      setErrors(prev => ({ ...prev, phone: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    
    if (!validateForm()) {
      showToast('error', 'Validation Error', { description: 'Please fix the errors below before saving' });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showToast('success', 'Customer updated successfully!');
        resetDirtyState();
        setTimeout(() => {
          router.push('/grower/customers');
          router.refresh();
        }, 1500);
      } else {
        const data = await response.json();
        showToast('error', data.error || 'Failed to update customer');
      }
    } catch {
      showToast('error', 'An error occurred while updating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast('success', 'Customer has been deleted');
        router.push('/grower/customers');
        router.refresh();
      } else {
        const data = await response.json();
        showToast('error', data.error || 'Failed to delete customer');
      }
    } catch {
      showToast('error', 'An error occurred while deleting');
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-6 p-4 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href="/grower/customers" className="text-sm text-gray-500 hover:text-gray-700">
            &larr; Back to Customers
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Edit Customer</h1>
          <p className="text-gray-600 mt-1">Update customer information</p>
        </div>
      </div>

      {isDirty && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          <span>You have unsaved changes.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name *
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => handleChange('businessName', e.target.value)}
                onBlur={() => handleBlur('businessName')}
                className={errors.businessName && touched.businessName ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
                placeholder="Enter business name"
              />
              {errors.businessName && touched.businessName && (
                <p className="text-sm text-red-600 mt-1">{errors.businessName}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Number
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => handleChange('licenseNumber', e.target.value)}
                  onBlur={() => handleBlur('licenseNumber')}
                  className={errors.licenseNumber && touched.licenseNumber ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
                  placeholder="License #"
                />
                {errors.licenseNumber && touched.licenseNumber && (
                  <p className="text-sm text-red-600 mt-1">{errors.licenseNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  onBlur={() => handleBlur('website')}
                  className={errors.website && touched.website ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
                  placeholder="https://..."
                />
                {errors.website && touched.website && (
                  <p className="text-sm text-red-600 mt-1">{errors.website}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                onBlur={() => handleBlur('description')}
                className={errors.description && touched.description 
                  ? "w-full px-3 py-2 border border-red-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-red-50" 
                  : "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"}
                placeholder="Brief description..."
              />
              {errors.description && touched.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description}</p>
              )}
              <p className="text-xs text-gray-500 text-right mt-1">
                {formData.description.length}/500 characters
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => handleChange('contactName', e.target.value)}
                  className={INPUT_CLASSES}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={errors.email && touched.email ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
                  placeholder="email@example.com"
                />
                {errors.email && touched.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onBlur={() => handleBlur('phone')}
                className={errors.phone && touched.phone ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
                placeholder="(555) 123-4567"
              />
              {errors.phone && touched.phone && (
                <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Address</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className={INPUT_CLASSES}
                placeholder="123 Main St"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className={INPUT_CLASSES}
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className={INPUT_CLASSES}
                >
                  {US_STATES.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleChange('zipCode', e.target.value)}
                  onBlur={() => handleBlur('zipCode')}
                  className={errors.zipCode && touched.zipCode ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
                  placeholder="12345"
                />
                {errors.zipCode && touched.zipCode && (
                  <p className="text-sm text-red-600 mt-1">{errors.zipCode}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleDelete}
            className="px-6 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Delete Customer
          </button>
          
          <div className="flex gap-3">
            <Link
              href="/grower/customers"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || (hasErrors && Object.keys(touched).length > 0)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
