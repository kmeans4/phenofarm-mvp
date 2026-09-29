'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { useUnsavedChanges } from '@/app/hooks/useUnsavedChanges';
import { STRAIN_TYPES, STRAIN_TYPE_LABELS } from '@/lib/strain-types';
export type StrainData = {
  id: string;
  name: string;
  strainType?: string | null;
  genetics?: string | null;
  description?: string | null;
  growerNotes?: string | null;
};
const input =
  'mt-1 min-h-11 w-full rounded-lg border border-pf-line-strong bg-pf-raised px-3 py-2 text-sm';
export function StrainForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: StrainData;
  onSaved: (strain: StrainData) => void;
  onCancel: () => void;
}) {
  const formId = useId();
  const fieldId = (name: string) => `${formId}-strain-${name}`;
  const [form, setForm] = useState({
    name: initial?.name || '',
    strainType: initial?.strainType || '',
    genetics: initial?.genetics || '',
    description: initial?.description || '',
    growerNotes: initial?.growerNotes || '',
  });
  const [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [errors, setErrors] = useState<Record<string, string>>({});
  const pending = useRef(false),
    ref = useRef<HTMLFormElement>(null);
  const { setIsDirty, resetDirtyState, confirmNavigation } =
    useUnsavedChanges();
  useEffect(() => setIsDirty(dirty), [dirty, setIsDirty]);
  function change(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setErrors((current) => ({ ...current, [key]: '' }));
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Enter a strain name.';
    if (form.name.length > 120) next.name = 'Use 120 characters or fewer.';
    setErrors(next);
    if (Object.keys(next).length) {
      ref.current
        ?.querySelector<HTMLInputElement>('input[name="name"]')
        ?.focus();
      return;
    }
    pending.current = true;
    setBusy(true);
    try {
      const response = await fetch(
        initial ? `/api/strains/${initial.id}` : '/api/strains',
        {
          method: initial ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            strainType: form.strainType || null,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        const key = /name/i.test(data.error) ? 'name' : 'form';
        setErrors({ [key]: data.error || 'Could not save strain.' });
        if (key === 'name')
          ref.current
            ?.querySelector<HTMLInputElement>('input[name="name"]')
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
      setBusy(false);
      pending.current = false;
    }
  }
  return (
    <form ref={ref} onSubmit={submit} noValidate className="space-y-4">
      <div className="text-sm">
        <label htmlFor={fieldId('name')}>Name</label>
        <input
          id={fieldId('name')}
          name="name"
          autoComplete="off"
          value={form.name}
          onChange={(event) => change('name', event.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? fieldId('name-error') : undefined}
          className={input}
        />
        {errors.name && (
          <span id={fieldId('name-error')} className="text-pf-danger">
            {errors.name}
          </span>
        )}
      </div>
      <label htmlFor={fieldId('type')} className="block text-sm">
        Type (optional)
        <select
          id={fieldId('type')}
          value={form.strainType}
          onChange={(event) => change('strainType', event.target.value)}
          className={input}
        >
          <option value="">Not specified</option>
          {STRAIN_TYPES.map((type) => (
            <option key={type} value={type}>
              {STRAIN_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>
      {(['genetics', 'description', 'growerNotes'] as const).map((key) => (
        <label key={key} htmlFor={fieldId(key)} className="block text-sm">
          {
            {
              genetics: 'Genetics',
              description: 'Description',
              growerNotes: 'Private grower notes',
            }[key]
          }
          <textarea
            id={fieldId(key)}
            rows={key === 'genetics' ? 1 : 3}
            maxLength={key === 'genetics' ? 500 : 2000}
            value={form[key]}
            onChange={(event) => change(key, event.target.value)}
            className={input}
          />
        </label>
      ))}
      {errors.form && (
        <p role="alert" className="text-sm text-pf-danger">
          {errors.form}
        </p>
      )}
      <div className="flex gap-3">
        <button
          disabled={busy}
          className="min-h-11 rounded-lg bg-pf-accent px-4 text-sm font-semibold text-pf-canvas"
        >
          {busy ? 'Saving…' : 'Save strain'}
        </button>
        <button
          type="button"
          disabled={busy}
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
