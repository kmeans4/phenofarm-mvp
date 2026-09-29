'use client';
import { useEffect, useRef, useState } from 'react';
import { useUnsavedChanges } from '@/app/hooks/useUnsavedChanges';
import {
  getTodayDateInputValue,
  isFutureDateInput,
  suggestBatchNumber,
  toDateInputValue,
} from '@/lib/batch-utils';
import { parseProductNumber } from '@/lib/product-payload';
import { StrainSelector } from './StrainSelector';
import {
  BatchLabDocumentUploaders,
  type BatchLabDocuments,
} from './BatchLabDocumentUploaders';
export type BatchData = {
  id: string;
  batchNumber: string;
  strainId: string;
  harvestDate: string;
  thc: number | string | null;
  cbd: number | string | null;
  totalCannabinoids?: number | string | null;
  lotNumber?: string | null;
  notes?: string | null;
  terpenes?: unknown;
  coaDocumentUrl?: string | null;
  testResults?: { labDocuments?: BatchLabDocuments } | null;
};
type FormData = {
  batchNumber: string;
  lotNumber: string;
  harvestDate: string;
  strainId: string;
  thc: string;
  cbd: string;
  totalCannabinoids: string;
  notes: string;
};
const input =
  'mt-1 min-h-11 w-full min-w-0 rounded-lg border border-pf-line-strong bg-pf-raised px-3 text-sm';
function initialTerpenes(value: unknown) {
  if (Array.isArray(value))
    return value.map(
      (item: { name?: string; percentage?: number | string }) => ({
        name: item.name || '',
        percentage: item.percentage == null ? '' : String(item.percentage),
      })
    );
  if (value && typeof value === 'object')
    return Object.entries(value).map(([name, percentage]) => ({
      name,
      percentage: String(percentage),
    }));
  return [];
}
export function BatchForm({
  initial,
  strainId = '',
  onSaved,
  onCancel,
  onDirtyChange,
  guarded = true,
}: {
  initial?: BatchData;
  strainId?: string;
  onSaved: (batch: BatchData) => void;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  guarded?: boolean;
}) {
  const strainInputId = guarded ? 'strainId' : 'new-batch-strainId';
  const initialValue: FormData = {
    batchNumber:
      initial?.batchNumber || suggestBatchNumber([], getTodayDateInputValue()),
    lotNumber: initial?.lotNumber || '',
    harvestDate:
      toDateInputValue(initial?.harvestDate) || getTodayDateInputValue(),
    strainId: initial?.strainId || strainId,
    thc: initial?.thc == null ? '' : String(initial.thc),
    cbd: initial?.cbd == null ? '' : String(initial.cbd),
    totalCannabinoids:
      initial?.totalCannabinoids == null
        ? ''
        : String(initial.totalCannabinoids),
    notes: initial?.notes || '',
  };
  const [form, setForm] = useState(initialValue),
    [terpenes, setTerpenes] = useState(initialTerpenes(initial?.terpenes));
  const [documents, setDocuments] = useState<BatchLabDocuments>(() => ({
    ...initial?.testResults?.labDocuments,
    ...(initial?.coaDocumentUrl && !initial?.testResults?.labDocuments?.coa
      ? {
          coa: {
            label: 'Full COA',
            fileName: 'Full COA.pdf',
            mimeType: 'application/pdf',
            dataUrl: initial.coaDocumentUrl,
            uploadedAt: '',
          },
        }
      : {}),
  }));
  const [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [dirty, setDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null),
    pending = useRef(false);
  const { setIsDirty, resetDirtyState, confirmNavigation } = useUnsavedChanges({
    enabled: guarded,
  });
  useEffect(() => {
    setIsDirty(dirty);
    onDirtyChange?.(dirty);
  }, [dirty, setIsDirty, onDirtyChange]);
  useEffect(() => {
    if (initial) return;
    const controller = new AbortController();
    fetch('/api/batches', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : []))
      .then((batches: BatchData[]) => {
        if (!controller.signal.aborted)
          setForm((current) =>
            current.batchNumber === initialValue.batchNumber
              ? {
                  ...current,
                  batchNumber: suggestBatchNumber(
                    batches.map((batch) => batch.batchNumber),
                    current.harvestDate
                  ),
                }
              : current
          );
      })
      .catch(() => {});
    return () => controller.abort();
    // Initial suggestion must never overwrite a number the user has typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function change(key: keyof FormData, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setErrors((current) => ({ ...current, [key]: '' }));
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending.current || uploading) return;
    const next: Record<string, string> = {};
    if (!form.batchNumber.trim()) next.batchNumber = 'Enter a batch number.';
    if (!form.strainId) next.strainId = 'Choose a strain.';
    if (!form.harvestDate || isFutureDateInput(form.harvestDate))
      next.harvestDate = 'Choose a harvest date of today or earlier.';
    for (const key of ['thc', 'cbd', 'totalCannabinoids'] as const) {
      const metric = parseProductNumber(form[key]);
      if (form[key] && (metric === null || metric < 0 || metric > 100))
        next[key] = 'Enter a percentage from 0 to 100.';
    }
    for (const [index, terpene] of terpenes.entries()) {
      const amount = parseProductNumber(terpene.percentage);
      if (!terpene.name.trim() || amount === null || amount < 0 || amount > 100)
        next[`terpene-${index}`] =
          'Enter a terpene name and percentage from 0 to 100.';
    }
    setErrors(next);
    if (Object.keys(next).length) {
      formRef.current
        ?.querySelector<HTMLElement>(
          `[id="${Object.keys(next)[0] === 'strainId' ? strainInputId : Object.keys(next)[0]}"]`
        )
        ?.focus();
      return;
    }
    pending.current = true;
    setBusy(true);
    try {
      const response = await fetch(
        initial ? `/api/batches/${initial.id}` : '/api/batches',
        {
          method: initial ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            thc: parseProductNumber(form.thc),
            cbd: parseProductNumber(form.cbd),
            totalCannabinoids: parseProductNumber(form.totalCannabinoids),
            terpenes: terpenes.map((item) => ({
              name: item.name.trim(),
              percentage: parseProductNumber(item.percentage),
            })),
            testResults: { ...initial?.testResults, labDocuments: documents },
            coaDocumentUrl: documents.coa?.dataUrl || null,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        const message = data.error || 'Could not save batch.';
        const field = /batch.*number/i.test(message)
          ? 'batchNumber'
          : /harvest/i.test(message)
            ? 'harvestDate'
            : /strain/i.test(message)
              ? 'strainId'
              : 'form';
        setErrors({ [field]: message });
        formRef.current
          ?.querySelector<HTMLElement>(
            `[id="${field === 'strainId' ? strainInputId : field}"]`
          )
          ?.focus();
        return;
      }
      setDirty(false);
      resetDirtyState();
      onSaved(data);
    } catch {
      setErrors({
        form: 'Connection lost. Your changes are here; try saving again.',
      });
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(['batchNumber', 'lotNumber', 'harvestDate'] as const).map((key) => (
          <label key={key} htmlFor={key} className="block text-sm">
            {
              {
                batchNumber: 'Batch number',
                lotNumber: 'Lot number (optional)',
                harvestDate: 'Harvest date',
              }[key]
            }
            <input
              id={key}
              value={form[key]}
              type={key === 'harvestDate' ? 'date' : 'text'}
              max={key === 'harvestDate' ? getTodayDateInputValue() : undefined}
              maxLength={key === 'harvestDate' ? undefined : 120}
              onChange={(event) => change(key, event.target.value)}
              aria-invalid={Boolean(errors[key])}
              aria-describedby={errors[key] ? `${key}-error` : undefined}
              className={input}
            />
            {errors[key] && (
              <span id={`${key}-error`} className="text-pf-danger">
                {errors[key]}
              </span>
            )}
          </label>
        ))}
      </div>
      <div>
        <label htmlFor={strainInputId} className="mb-1 block text-sm">
          Strain
        </label>
        <StrainSelector
          inputId={strainInputId}
          strainId={form.strainId}
          onStrainChange={(id) => change('strainId', id || '')}
        />
        {errors.strainId && (
          <p role="alert" className="text-sm text-pf-danger">
            {errors.strainId}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(['thc', 'cbd', 'totalCannabinoids'] as const).map((key) => (
          <label htmlFor={key} key={key} className="text-sm">
            {
              {
                thc: 'THC (%)',
                cbd: 'CBD (%)',
                totalCannabinoids: 'Total cannabinoids (%)',
              }[key]
            }
            <input
              id={key}
              inputMode="decimal"
              value={form[key]}
              onChange={(event) => change(key, event.target.value)}
              onBlur={() => {
                const value = parseProductNumber(form[key]);
                if (value !== null)
                  setForm((current) => ({ ...current, [key]: String(value) }));
              }}
              aria-invalid={Boolean(errors[key])}
              className={input}
            />
            {errors[key] && (
              <span className="text-pf-danger">{errors[key]}</span>
            )}
          </label>
        ))}
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Terpenes (optional)</legend>
        {terpenes.map((terpene, index) => (
          <div key={index} className="space-y-1">
            <div className="grid grid-cols-[minmax(0,1fr)_6rem_auto] items-end gap-2">
              <label className="text-sm">
                Name
                <input
                  id={`terpene-${index}`}
                  value={terpene.name}
                  onChange={(event) => {
                    setTerpenes((current) =>
                      current.map((item, i) =>
                        i === index
                          ? { ...item, name: event.target.value }
                          : item
                      )
                    );
                    setDirty(true);
                  }}
                  className={input}
                />
              </label>
              <label className="text-sm">
                %
                <input
                  inputMode="decimal"
                  value={terpene.percentage}
                  onChange={(event) => {
                    setTerpenes((current) =>
                      current.map((item, i) =>
                        i === index
                          ? { ...item, percentage: event.target.value }
                          : item
                      )
                    );
                    setDirty(true);
                  }}
                  className={input}
                />
              </label>
              <button
                type="button"
                aria-label={`Remove terpene ${index + 1}`}
                onClick={() => {
                  setTerpenes((current) =>
                    current.filter((_, i) => i !== index)
                  );
                  setDirty(true);
                }}
                className="min-h-11 px-2 text-pf-danger"
              >
                ×
              </button>
            </div>
            {errors[`terpene-${index}`] && (
              <p className="text-sm text-pf-danger">
                {errors[`terpene-${index}`]}
              </p>
            )}
          </div>
        ))}
        <button
          type="button"
          className="min-h-11 text-sm text-pf-accent"
          onClick={() => {
            setTerpenes((current) => [
              ...current,
              { name: '', percentage: '' },
            ]);
            setDirty(true);
          }}
        >
          + Add terpene
        </button>
      </fieldset>
      <BatchLabDocumentUploaders
        value={documents}
        onChange={(documents) => {
          setDocuments(documents);
          setDirty(true);
        }}
        onUploadingChange={setUploading}
        disabled={busy}
      />
      <label htmlFor="notes" className="block text-sm">
        Notes
        <textarea
          id="notes"
          rows={3}
          maxLength={2000}
          value={form.notes}
          onChange={(event) => change('notes', event.target.value)}
          className={`${input} py-2`}
        />
      </label>
      {errors.form && (
        <p role="alert" className="text-sm text-pf-danger">
          {errors.form}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={busy || uploading}
          className="min-h-11 rounded-lg bg-pf-accent px-4 text-sm font-semibold text-pf-canvas"
        >
          {busy ? 'Saving…' : 'Save batch'}
        </button>
        <button
          type="button"
          disabled={busy || uploading}
          onClick={async () => {
            if (await confirmNavigation()) onCancel();
          }}
          className="min-h-11 rounded-lg border border-pf-line-strong px-4 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
