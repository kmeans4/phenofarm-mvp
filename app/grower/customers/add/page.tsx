'use client';

import { useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/app/components/ui/PageHeader';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (value: string) => EMAIL_REGEX.test(value.trim());
const isValidPhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 11;
};

export default function AddCustomerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'VT',
    zipCode: '',
    licenseNumber: '',
  });

  const canSubmit = useMemo(() => {
    return (
      !isSubmitting &&
      formData.businessName.trim().length > 1 &&
      formData.contactName.trim().length > 1 &&
      isValidEmail(formData.email) &&
      isValidPhone(formData.phone)
    );
  }, [formData, isSubmitting]);

  const pendingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingRef.current) return;

    if (!canSubmit) {
      if (!isValidEmail(formData.email)) {
        setError('Please enter a valid email address.');
      } else if (!isValidPhone(formData.phone)) {
        setError('Please enter a valid phone number.');
      } else {
        setError('Please complete all required fields before saving.');
      }
      return;
    }

    pendingRef.current = true;
    setIsSubmitting(true);
    setError('');

    const payload = {
      businessName: formData.businessName.trim(),
      contactName: formData.contactName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim().toUpperCase().slice(0, 2) || 'VT',
      zip: formData.zipCode.trim(),
      licenseNumber: formData.licenseNumber.trim(),
    };

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push('/grower/customers');
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.error || 'Failed to add customer');
      }
    } catch {
      setError('An error occurred');
    } finally {
      pendingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <PageHeader title="Add customer" />

      {error && (
        <div className="p-4 bg-pf-danger-bg border border-pf-danger-line rounded-lg text-pf-danger">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="bg-pf-surface rounded-lg shadow-sm border border-pf-line">
          <div className="p-4 space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label htmlFor="customer-businessName" className="block text-sm font-medium text-pf-secondary mb-1">Business Name *</label>
                <input id="customer-businessName" type="text" required value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-3 py-2 border border-pf-line-strong rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="customer-contactName" className="block text-sm font-medium text-pf-secondary mb-1">Contact Name *</label>
                <input id="customer-contactName" type="text" required value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full px-3 py-2 border border-pf-line-strong rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="customer-email" className="block text-sm font-medium text-pf-secondary mb-1">Email *</label>
                <input id="customer-email" type="email" required value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-pf-line-strong rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="customer-phone" className="block text-sm font-medium text-pf-secondary mb-1">Phone *</label>
                <input id="customer-phone" type="tel" required value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-pf-line-strong rounded-lg"
                />
              </div>
            </div>

            <details className="rounded-lg border border-pf-line px-3">
              <summary className="min-h-10 cursor-pointer py-2 text-sm font-medium text-pf-secondary">Address & license <span className="font-normal text-pf-muted">(optional)</span></summary>
              <div className="space-y-3 pb-3 sm:space-y-4">
                <div>
                  <label htmlFor="customer-address" className="block text-sm font-medium text-pf-secondary mb-1">Address</label>
                  <input id="customer-address" type="text" value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-pf-line-strong rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label htmlFor="customer-city" className="block text-sm font-medium text-pf-secondary mb-1">City</label>
                    <input id="customer-city" type="text" value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-pf-line-strong rounded-lg"
                    />
                  </div>
                  <div>
                    <label htmlFor="customer-state" className="block text-sm font-medium text-pf-secondary mb-1">State</label>
                    <input id="customer-state" type="text" value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 border border-pf-line-strong rounded-lg"
                    />
                  </div>
                  <div>
                    <label htmlFor="customer-zipCode" className="block text-sm font-medium text-pf-secondary mb-1">ZIP</label>
                    <input id="customer-zipCode" type="text" value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      className="w-full px-3 py-2 border border-pf-line-strong rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="customer-licenseNumber" className="block text-sm font-medium text-pf-secondary mb-1">License Number</label>
                  <input id="customer-licenseNumber" type="text" value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-pf-line-strong rounded-lg"
                    placeholder="VT-DISP-XXXXX"
                  />
                </div>
              </div>
            </details>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href="/grower/customers"
            className={`flex-1 sm:flex-none text-center px-4 py-2 border border-pf-line-strong rounded-lg hover:bg-pf-canvas ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex-1 sm:flex-none whitespace-nowrap px-4 py-2 text-sm sm:text-base bg-emerald-500 text-[#032116] rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Adding...' : 'Add customer'}
          </button>
        </div>
      </form>
    </div>
  );
}
