'use client';
import { useId, useRef, useState } from 'react';
import { uploadFile } from '@/app/components/uploads/uploadFile';
import {
  FILE_UPLOAD_LIMITS,
  formatBytes,
  validateBatchLabDocumentFile,
} from '@/lib/upload-validation';
export type BatchLabDocumentKey =
  | 'coa'
  | 'cannabinoids'
  | 'pesticides'
  | 'microbials';
export interface BatchLabDocument {
  label: string;
  fileName: string;
  mimeType: string;
  dataUrl: string;
  uploadedAt: string;
}
export type BatchLabDocuments = Partial<
  Record<BatchLabDocumentKey, BatchLabDocument>
>;
export const BATCH_LAB_DOCUMENT_LABELS: Record<BatchLabDocumentKey, string> = {
  coa: 'Full COA',
  cannabinoids: 'Potency',
  pesticides: 'Pesticides',
  microbials: 'Microbials',
};
export const BATCH_LAB_DOCUMENT_KEYS = Object.keys(
  BATCH_LAB_DOCUMENT_LABELS
) as BatchLabDocumentKey[];
export function createEmptyBatchLabDocuments(): BatchLabDocuments {
  return {};
}
export function hasBatchLabDocuments(documents: BatchLabDocuments): boolean {
  return Object.values(documents).some(Boolean);
}
export function countBatchLabDocuments(
  documents: BatchLabDocuments | null | undefined
): number {
  return documents?.coa
    ? 3
    : ['cannabinoids', 'pesticides', 'microbials'].filter((key) =>
        Boolean(documents?.[key as BatchLabDocumentKey])
      ).length;
}
export function BatchLabDocumentUploaders({
  value,
  onChange,
  onError,
  onUploadingChange,
  disabled = false,
}: {
  value: BatchLabDocuments;
  onChange: (documents: BatchLabDocuments) => void;
  onError?: (message: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
  disabled?: boolean;
}) {
  const prefix = useId(),
    [uploading, setUploading] = useState<BatchLabDocumentKey | null>(null),
    [errors, setErrors] = useState<
      Partial<Record<BatchLabDocumentKey, string>>
    >({}),
    [individual, setIndividual] = useState(
      Boolean(value.cannabinoids || value.pesticides || value.microbials)
    );
  const current = useRef(value);
  current.current = value;
  const pending = useRef(false);
  async function upload(key: BatchLabDocumentKey, file?: File) {
    if (!file || disabled || pending.current) return;
    const checked = validateBatchLabDocumentFile(file);
    if (!checked.ok) {
      setErrors({ [key]: checked.error });
      onError?.(checked.error);
      return;
    }
    pending.current = true;
    setUploading(key);
    setErrors({});
    onUploadingChange?.(true);
    try {
      const url = await uploadFile(file, 'document');
      onChange({
        ...current.current,
        [key]: {
          label: BATCH_LAB_DOCUMENT_LABELS[key],
          fileName: file.name,
          mimeType: 'application/pdf',
          dataUrl: url,
          uploadedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Upload failed. Try again.';
      setErrors({ [key]: message });
      onError?.(message);
    } finally {
      pending.current = false;
      setUploading(null);
      onUploadingChange?.(false);
    }
  }
  const keys: BatchLabDocumentKey[] = individual
    ? BATCH_LAB_DOCUMENT_KEYS
    : ['coa'];
  return (
    <section className="space-y-3">
      <h2 className="font-semibold">Lab reports</h2>
      <p className="text-sm text-pf-muted">
        One full COA covers the product’s lab reports. PDF ·{' '}
        {formatBytes(FILE_UPLOAD_LIMITS.batchLabDocumentMaxBytes)} each.
      </p>
      {keys.map((key) => (
        <div key={key} className="rounded-lg border border-pf-line p-3">
          <label
            htmlFor={`${prefix}-${key}`}
            className="block text-sm font-medium"
          >
            {BATCH_LAB_DOCUMENT_LABELS[key]}
          </label>
          {value[key] && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <span className="min-w-0 break-all text-pf-accent">
                {value[key]!.fileName}
              </span>
              <a
                className="inline-flex min-h-11 items-center underline"
                href={value[key]!.dataUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View
              </a>
              <button
                type="button"
                disabled={Boolean(uploading) || disabled}
                onClick={() => {
                  const next = { ...value };
                  delete next[key];
                  onChange(next);
                }}
                className="min-h-11 px-2 text-pf-danger"
              >
                Remove
              </button>
            </div>
          )}
          <input
            id={`${prefix}-${key}`}
            type="file"
            accept="application/pdf,.pdf"
            disabled={Boolean(uploading) || disabled}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              void upload(key, file);
            }}
            className="mt-2 min-h-11 w-full min-w-0 rounded-lg border border-pf-line-strong p-2 text-sm"
          />
          {uploading === key && (
            <div role="status" className="mt-2 text-sm">
              <progress
                aria-label={`Uploading ${BATCH_LAB_DOCUMENT_LABELS[key]}`}
                className="h-2 w-full"
              />
              Uploading…
            </div>
          )}
          {errors[key] && (
            <p role="alert" className="mt-2 text-sm text-pf-danger">
              {errors[key]}
            </p>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => setIndividual((value) => !value)}
        className="min-h-11 text-sm text-pf-accent underline"
      >
        {individual
          ? 'Hide individual reports'
          : 'Add separate potency, pesticide or microbial reports'}
      </button>
    </section>
  );
}
