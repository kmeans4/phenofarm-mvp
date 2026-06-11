'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { DraftAutosaveStatus } from '@/app/components/ux/DraftAutosaveStatus';
import { useLocalDraft } from '@/app/hooks/useLocalDraft';
import {
  COMMERCIAL_TERMS_STORAGE_KEY,
  DEFAULT_COMMERCIAL_TERMS,
  type CommercialTermsDefaults,
} from '@/lib/ux-workflow';

const FIELD_CLASS = 'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500';

export function CommercialTermsPanel() {
  const [terms, setTerms] = useState<CommercialTermsDefaults>(DEFAULT_COMMERCIAL_TERMS);
  const [savedNotice, setSavedNotice] = useState('');

  const draftValue = useMemo(() => terms, [terms]);
  const draft = useLocalDraft({
    key: COMMERCIAL_TERMS_STORAGE_KEY,
    value: draftValue,
    onRestore: (value) => setTerms({ ...DEFAULT_COMMERCIAL_TERMS, ...value }),
  });

  const updateTerm = (field: keyof CommercialTermsDefaults, value: string) => {
    setSavedNotice('');
    setTerms((prev) => ({ ...prev, [field]: value }));
  };

  const resetDefaults = () => {
    setTerms(DEFAULT_COMMERCIAL_TERMS);
    setSavedNotice('Defaults restored. Browser terms will autosave after a moment.');
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reusable defaults</p>
          <h2 className="mt-1 text-lg font-semibold text-gray-900">Commercial terms</h2>
          <p className="mt-1 text-sm text-gray-600">
            Save the fulfillment and direct-settlement notes you repeat most often. These stay in this browser for now.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={resetDefaults}>
          Reset
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        <DraftAutosaveStatus savedAt={draft.savedAt} label="Commercial terms" onClear={draft.clearDraft} />
        {savedNotice && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{savedNotice}</p>}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-gray-700">
          Default MOQ
          <input
            value={terms.minimumOrder}
            onChange={(event) => updateTerm('minimumOrder', event.target.value)}
            className={FIELD_CLASS}
            placeholder="Example: 10 units or $500 minimum"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Fulfillment methods
          <input
            value={terms.fulfillmentMethods}
            onChange={(event) => updateTerm('fulfillmentMethods', event.target.value)}
            className={FIELD_CLASS}
            placeholder="Pickup, delivery, or coordinated route"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Fulfillment region
          <input
            value={terms.fulfillmentRegion}
            onChange={(event) => updateTerm('fulfillmentRegion', event.target.value)}
            className={FIELD_CLASS}
            placeholder="Example: Vermont buyers"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Direct payment terms
          <input
            value={terms.paymentTerms}
            onChange={(event) => updateTerm('paymentTerms', event.target.value)}
            className={FIELD_CLASS}
            placeholder="Example: Net 15, ACH, check"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Response window
          <input
            value={terms.responseWindow}
            onChange={(event) => updateTerm('responseWindow', event.target.value)}
            className={FIELD_CLASS}
            placeholder="Example: within 1 business day"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Contact note
          <input
            value={terms.contactNote}
            onChange={(event) => updateTerm('contactNote', event.target.value)}
            className={FIELD_CLASS}
            placeholder="Message before fulfillment"
          />
        </label>
      </div>

      <p className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-900">
        These terms are informational defaults only. PhenoFarm does not collect or remit wholesale payments between businesses.
      </p>
    </section>
  );
}
