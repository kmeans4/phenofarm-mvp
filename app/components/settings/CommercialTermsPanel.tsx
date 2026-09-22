'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import {
  DEFAULT_COMMERCIAL_TERMS,
  type CommercialTermsDefaults,
} from '@/lib/ux-workflow';

const FIELD_CLASS = 'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base sm:text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500';

export function CommercialTermsPanel({ initialData }: { initialData?: { terms: CommercialTermsDefaults; savedAt: string | null } }) {
  const [terms, setTerms] = useState<CommercialTermsDefaults>(initialData?.terms || DEFAULT_COMMERCIAL_TERMS);
  const [savedAt, setSavedAt] = useState<string | null>(initialData?.savedAt || null);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) return;
    let active = true;

    async function loadTerms() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/grower/commercial-terms');
        const data = await response.json().catch(() => ({}));

        if (!active) return;

        if (!response.ok) {
          throw new Error(data.error || 'Unable to load commercial terms');
        }

        setTerms({ ...DEFAULT_COMMERCIAL_TERMS, ...(data.terms || {}) });
        setSavedAt(data.savedAt || null);
      } catch (error) {
        if (!active) return;
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load commercial terms');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadTerms();

    return () => {
      active = false;
    };
  }, [initialData]);

  const updateTerm = (field: keyof CommercialTermsDefaults, value: string) => {
    setStatusMessage('');
    setErrorMessage('');
    setTerms((prev) => ({ ...prev, [field]: value }));
  };

  const saveTerms = async (nextTerms = terms) => {
    try {
      setIsSaving(true);
      setStatusMessage('');
      setErrorMessage('');

      const response = await fetch('/api/grower/commercial-terms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terms: nextTerms }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to save commercial terms');
      }

      setTerms({ ...DEFAULT_COMMERCIAL_TERMS, ...(data.terms || nextTerms) });
      setSavedAt(data.savedAt || new Date().toISOString());
      setStatusMessage('Terms saved.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save commercial terms');
    } finally {
      setIsSaving(false);
    }
  };

  const resetDefaults = async () => {
    setTerms(DEFAULT_COMMERCIAL_TERMS);
    await saveTerms(DEFAULT_COMMERCIAL_TERMS);
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Commercial terms</h2>
          <p className="mt-1 text-sm text-gray-600">
            Shown to buyers on your shop.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={resetDefaults} disabled={isLoading || isSaving}>
            Reset defaults
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={() => saveTerms()} disabled={isLoading || isSaving}>
            {isSaving ? 'Saving...' : 'Save terms'}
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {savedAt && (
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
            Last saved {new Date(savedAt).toLocaleString()}
          </p>
        )}
        {statusMessage && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{statusMessage}</p>}
        {errorMessage && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>}
      </div>

      <div className={`mt-3 grid gap-3 sm:mt-4 sm:gap-4 md:grid-cols-2 ${isLoading ? 'opacity-60' : ''}`}>
        <label className="block text-sm font-medium text-gray-700">
          Default MOQ
          <input
            value={terms.minimumOrder}
            onChange={(event) => updateTerm('minimumOrder', event.target.value)}
            disabled={isLoading || isSaving}
            className={FIELD_CLASS}
            placeholder="Example: 10 units or $500 minimum"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Fulfillment
          <input
            value={terms.fulfillmentMethods}
            onChange={(event) => updateTerm('fulfillmentMethods', event.target.value)}
            disabled={isLoading || isSaving}
            className={FIELD_CLASS}
            placeholder="Pickup, delivery, or coordinated route"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Region
          <input
            value={terms.fulfillmentRegion}
            onChange={(event) => updateTerm('fulfillmentRegion', event.target.value)}
            disabled={isLoading || isSaving}
            className={FIELD_CLASS}
            placeholder="Example: Vermont buyers"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Payment terms
          <input
            value={terms.paymentTerms}
            onChange={(event) => updateTerm('paymentTerms', event.target.value)}
            disabled={isLoading || isSaving}
            className={FIELD_CLASS}
            placeholder="Example: Net 15, ACH, check"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Response time
          <input
            value={terms.responseWindow}
            onChange={(event) => updateTerm('responseWindow', event.target.value)}
            disabled={isLoading || isSaving}
            className={FIELD_CLASS}
            placeholder="Example: within 1 business day"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Contact note
          <textarea
            rows={2}
            value={terms.contactNote}
            onChange={(event) => updateTerm('contactNote', event.target.value)}
            disabled={isLoading || isSaving}
            className={FIELD_CLASS}
            placeholder="Message before fulfillment"
          />
        </label>
      </div>

      <p className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-900">
        Defaults only; confirm final terms with each buyer.
      </p>
    </section>
  );
}
