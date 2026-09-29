'use client';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  STRAIN_TYPES,
  STRAIN_TYPE_LABELS,
  type StrainTypeValue,
} from '@/lib/strain-types';
export interface StrainOption {
  id: string;
  name: string;
  strainType: StrainTypeValue | null;
  genetics: string | null;
}
const input =
  'min-h-11 min-w-0 w-full rounded-lg border border-pf-line-strong bg-pf-raised px-3 text-sm';
export function StrainSelector({
  strainId,
  onStrainChange,
  inputId = 'strainId',
}: {
  strainId: string;
  onStrainChange: (id: string | null, name?: string) => void;
  inputId?: string;
}) {
  const prefix = useId(),
    [strains, setStrains] = useState<StrainOption[]>([]),
    [search, setSearch] = useState(''),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState('');
  const [creating, setCreating] = useState(false),
    [open, setOpen] = useState(false),
    [error, setError] = useState('');
  const [name, setName] = useState(''),
    [type, setType] = useState(''),
    [genetics, setGenetics] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetch('/api/strains?summary=true');
      if (!response.ok) throw new Error('Could not load strains.');
      setStrains(await response.json());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Connection lost.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function create() {
    if (creating) return;
    if (!name.trim()) {
      setError('Enter a strain name.');
      nameRef.current?.focus();
      return;
    }
    setCreating(true);
    setError('');
    try {
      const response = await fetch('/api/strains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          strainType: type || null,
          genetics: genetics || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save strain.');
      setStrains((current) =>
        [...current, data].sort((a, b) => a.name.localeCompare(b.name))
      );
      onStrainChange(data.id, data.name);
      setOpen(false);
      setName('');
      setType('');
      setGenetics('');
      setSearch('');
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Connection lost. Retry.'
      );
    } finally {
      setCreating(false);
    }
  }
  const options = strains.filter(
    (strain) =>
      strain.id === strainId ||
      `${strain.name} ${strain.genetics || ''}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );
  return (
    <div className="space-y-2">
      {strains.length > 6 && (
        <input
          type="search"
          aria-label="Search strains"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search strains"
          className={input}
        />
      )}
      <div className="flex gap-2">
        <select
          id={inputId}
          aria-label="Strain"
          value={strainId}
          onChange={(event) => {
            const strain = strains.find(
              (strain) => strain.id === event.target.value
            );
            onStrainChange(strain?.id || null, strain?.name);
          }}
          className={input}
        >
          <option value="">{loading ? 'Loading strains…' : 'No strain'}</option>
          {options.map((strain) => (
            <option key={strain.id} value={strain.id}>
              {strain.name}
              {strain.strainType
                ? ` · ${STRAIN_TYPE_LABELS[strain.strainType]}`
                : ''}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="min-h-11 shrink-0 rounded-lg border border-pf-line-strong px-3 text-sm"
        >
          + New
        </button>
      </div>
      {loadError && (
        <p role="alert" className="text-sm text-pf-danger">
          {loadError}{' '}
          <button type="button" onClick={load} className="min-h-11 underline">
            Retry
          </button>
        </p>
      )}
      {!loading && !loadError && !strains.length && (
        <p className="text-sm text-pf-muted">
          No strains yet. Add one, or leave blank.
        </p>
      )}
      {open && (
        <fieldset
          className="space-y-3 rounded-lg border border-pf-line p-3"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void create();
            }
          }}
        >
          <legend className="px-1 text-sm font-semibold">New strain</legend>
          <label htmlFor={`${prefix}-name`} className="block text-sm">
            Name
            <input
              id={`${prefix}-name`}
              ref={nameRef}
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(error)}
              className={input}
            />
          </label>
          <label htmlFor={`${prefix}-type`} className="block text-sm">
            Type (optional)
            <select
              id={`${prefix}-type`}
              value={type}
              onChange={(event) => setType(event.target.value)}
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
          <label htmlFor={`${prefix}-genetics`} className="block text-sm">
            Genetics
            <input
              id={`${prefix}-genetics`}
              value={genetics}
              onChange={(event) => setGenetics(event.target.value)}
              className={input}
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-pf-danger">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              disabled={creating}
              type="button"
              onClick={create}
              className="min-h-11 rounded-lg bg-pf-accent px-4 text-sm font-semibold text-pf-canvas"
            >
              {creating ? 'Saving…' : 'Add strain'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-11 px-3 text-sm"
            >
              Cancel
            </button>
          </div>
        </fieldset>
      )}
    </div>
  );
}
