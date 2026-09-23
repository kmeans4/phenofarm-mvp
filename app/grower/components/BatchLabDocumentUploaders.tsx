'use client';

import { ChangeEvent, useRef, useState, useEffect } from 'react';
import { uploadFile } from '@/app/components/uploads/uploadFile';
import { CheckCircle2 } from 'lucide-react';
import { FILE_UPLOAD_LIMITS, formatBytes, validateBatchLabDocumentFile } from '@/lib/upload-validation';

export type BatchLabDocumentKey = 'cannabinoids' | 'pesticides' | 'microbials';

export interface BatchLabDocument {
  label: string;
  fileName: string;
  mimeType: string;
  dataUrl: string;
  uploadedAt: string;
}

export type BatchLabDocuments = Partial<Record<BatchLabDocumentKey, BatchLabDocument>>;

export const BATCH_LAB_DOCUMENT_LABELS: Record<BatchLabDocumentKey, string> = {
  cannabinoids: 'Potency',
  pesticides: 'Pesticides',
  microbials: 'Microbials'
};

export const BATCH_LAB_DOCUMENT_KEYS = Object.keys(BATCH_LAB_DOCUMENT_LABELS) as BatchLabDocumentKey[];


export function createEmptyBatchLabDocuments(): BatchLabDocuments {
  return {};
}

export function hasBatchLabDocuments(documents: BatchLabDocuments): boolean {
  return Object.values(documents).some(Boolean);
}

export function countBatchLabDocuments(documents: BatchLabDocuments | null | undefined): number {
  if (!documents) return 0;
  return BATCH_LAB_DOCUMENT_KEYS.filter((key) => Boolean(documents[key])).length;
}

interface BatchLabDocumentUploadersProps {
  value: BatchLabDocuments;
  onChange: (documents: BatchLabDocuments) => void;
  onError?: (message: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
  disabled?: boolean;
}

export function BatchLabDocumentUploaders({ value, onChange, onError, onUploadingChange, disabled = false }: BatchLabDocumentUploadersProps) {
  const [uploading, setUploading] = useState(false);
  const pendingRef = useRef(false);
  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);
  const inputRefs = useRef<Record<BatchLabDocumentKey, HTMLInputElement | null>>({
    cannabinoids: null,
    pesticides: null,
    microbials: null
  });

  const handleFileChange = async (key: BatchLabDocumentKey, event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file || disabled || pendingRef.current) return;
    const validation = validateBatchLabDocumentFile(file);
    if (!validation.ok) { onError?.(validation.error); return; }
    pendingRef.current = true;
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const dataUrl = await uploadFile(file, 'document');
      onChange({ ...valueRef.current, [key]: {
        label: BATCH_LAB_DOCUMENT_LABELS[key], fileName: file.name,
        mimeType: file.type, dataUrl, uploadedAt: new Date().toISOString(),
      } });
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Could not upload this document.');
    } finally { pendingRef.current = false; setUploading(false); onUploadingChange?.(false); }
  };

  const handleRemove = (key: BatchLabDocumentKey) => {
    const next = { ...value };
    delete next[key];
    if (inputRefs.current[key]) {
      inputRefs.current[key].value = '';
    }
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <h4 className="text-sm font-medium text-gray-900">Lab PDFs</h4>
        <p className="text-xs text-gray-600">
          PDF · {formatBytes(FILE_UPLOAD_LIMITS.batchLabDocumentMaxBytes)} max each
        </p>
      </div>

      <div className="grid grid-cols-1 divide-y divide-gray-200 rounded-lg border border-gray-200">
        {BATCH_LAB_DOCUMENT_KEYS.map((key) => {
          const document = value[key];

          return (
            <div key={key} className="flex flex-wrap items-center justify-between gap-2 bg-white px-3 py-2 sm:p-3">
              <div className="min-w-0 flex-1 space-y-1">
                <label htmlFor={`lab-document-${key}`} className="block text-sm font-medium text-gray-700">
                  {BATCH_LAB_DOCUMENT_LABELS[key]}
                </label>
                {document ? (
                  <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>Uploaded</span>
                    <span className="max-w-44 truncate font-medium text-green-900">{document.fileName}</span>
                  </span>
                ) : null}

              </div>
              <input
                id={`lab-document-${key}`}
                ref={(node) => {
                  inputRefs.current[key] = node;
                }}
                type="file"
                disabled={uploading || disabled}
                accept="application/pdf,.pdf"
                onChange={(event) => handleFileChange(key, event)}
                className="sr-only"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={uploading || disabled}
                  aria-label={`${document ? 'Replace' : 'Upload'} ${BATCH_LAB_DOCUMENT_LABELS[key]} PDF`}
                  onClick={() => inputRefs.current[key]?.click()}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                >
                  {document ? 'Replace' : 'Upload'}
                </button>
                {document && (
                  <button
                    type="button"
                  disabled={uploading || disabled}
                    onClick={() => handleRemove(key)}
                    className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
