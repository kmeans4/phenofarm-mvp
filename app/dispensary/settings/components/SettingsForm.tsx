'use client';

import { useState } from 'react';
import { AddressAutocomplete } from '@/app/components/ui/AddressAutocomplete';

interface SettingsFormProps {
  defaultValues: {
    businessName: string;
    licenseNumber: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    website: string;
    description: string;
  };
}

export function SettingsForm({ defaultValues }: SettingsFormProps) {
  const [formData, setFormData] = useState(defaultValues);

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
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input 
                type="text" 
                value={formData.businessName}
                onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dispensary License Number</label>
              <input 
                type="text" 
                value={formData.licenseNumber}
                onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Email</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone</label>
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
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
              <textarea 
                rows={3} 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500" 
              />
            </div>
          </div>
        </div>

        {/* Banking & Payment */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Banking Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Bank Name</label>
              <input type="text" placeholder="Bank name" className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
              <input type="text" placeholder="Account holder name" className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Routing Number</label>
                <input type="text" placeholder="Routing #" className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <input type="text" placeholder="Account #" className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500" />
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800"><strong>Security Note:</strong> Your banking information is encrypted and never shared.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium transition">
          Save Changes
        </button>
      </div>
    </div>
  );
}
