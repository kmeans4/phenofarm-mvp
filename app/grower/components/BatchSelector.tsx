'use client';
import { useCallback, useEffect, useState } from 'react';
import { Modal } from '@/app/components/ui/Modal';
import { askToLeave } from '@/app/components/ui/UnsavedChangesDialog';
import { BatchForm, type BatchData } from './BatchForm';
export type BatchOption = BatchData & { strain?: { name: string } };
export function BatchSelector({
  strainId,
  batchId,
  onBatchChange,
}: {
  strainId?: string;
  batchId: string;
  onBatchChange: (id: string | null, batch?: BatchOption) => void;
}) {
  const [batches, setBatches] = useState<BatchOption[]>([]),
    [search, setSearch] = useState(''),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [open, setOpen] = useState(false),
    [dirty, setDirty] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/batches');
      if (!response.ok) throw new Error('Could not load batches.');
      setBatches(await response.json());
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Connection lost.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const options = batches.filter(
    (batch) =>
      batch.id === batchId ||
      ((!strainId || batch.strainId === strainId) &&
        `${batch.batchNumber} ${batch.strain?.name || ''}`
          .toLowerCase()
          .includes(search.toLowerCase()))
  );
  async function close() {
    if (!dirty || (await askToLeave('Your new batch has not been saved.'))) {
      setOpen(false);
      setDirty(false);
    }
  }
  return (
    <div className="space-y-2">
      {batches.length > 6 && (
        <input
          type="search"
          aria-label="Search batches"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search batches"
          className="min-h-11 w-full rounded-lg border border-pf-line-strong bg-pf-raised px-3 text-sm"
        />
      )}
      <div className="flex gap-2">
        <select
          id="batchId"
          aria-label="Batch"
          value={batchId}
          onChange={(event) => {
            const batch = batches.find(
              (batch) => batch.id === event.target.value
            );
            onBatchChange(batch?.id || null, batch);
          }}
          className="min-h-11 min-w-0 w-full rounded-lg border border-pf-line-strong bg-pf-raised px-3 text-sm"
        >
          <option value="">{loading ? 'Loading batches…' : 'No batch'}</option>
          {options.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.batchNumber}
              {!strainId && batch.strain ? ` · ${batch.strain.name}` : ''}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="min-h-11 shrink-0 rounded-lg border border-pf-line-strong px-3 text-sm"
        >
          + New
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-pf-danger">
          {error}{' '}
          <button type="button" onClick={load} className="min-h-11 underline">
            Retry
          </button>
        </p>
      )}
      {!loading && !error && !options.length && (
        <p className="text-sm text-pf-muted">
          No batches match. Add one, or leave blank.
        </p>
      )}
      <Modal
        open={open}
        onClose={() => {
          void close();
        }}
        preventBackdropClose
        dismissible={!dirty}
        title="New batch"
        className="max-w-2xl"
      >
        {open && (
          <BatchForm
            strainId={strainId}
            guarded={false}
            onDirtyChange={setDirty}
            onSaved={(batch) => {
              setBatches((current) => [batch, ...current]);
              onBatchChange(batch.id, batch);
              setDirty(false);
              setOpen(false);
            }}
            onCancel={() => {
              void close();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
