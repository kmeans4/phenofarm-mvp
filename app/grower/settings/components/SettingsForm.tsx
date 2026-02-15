'use client';

import { useState, useEffect } from 'react';
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

export function SettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  
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

  const handleSave = async (isLogoSave = false) => {
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
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}
      
      {saved && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
          Settings saved successfully!
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name
              </label>
              <input 
                type="text" 
                value={formData.businessName}
                onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input 
                type="text" 
                value={formData.contactName}
                onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                placeholder="Primary contact person"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business License Number
              </label>
              <input 
                type="text" 
                value={formData.licenseNumber}
                onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Email
              </label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Phone
              </label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Address <span className="text-green-600 text-xs font-medium">(Autocomplete)</span>
              </label>
              <AddressAutocomplete
                value={formData.address}
                onChange={(value) => setFormData({...formData, address: value})}
                onSelect={handleAddressSelect}
                placeholder="Type your address..."
              />
              <p className="text-xs text-gray-500 mt-1">Type 3+ characters to see suggestions (includes city, state, ZIP)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input 
                type="url" 
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
                placeholder="https://"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button 
          onClick={() => handleSave(false)}
          disabled={saving}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
