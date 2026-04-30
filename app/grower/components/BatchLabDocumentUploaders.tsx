'use client';

import { ChangeEvent } from 'react';

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
  cannabinoids: 'Potency Test',
  pesticides: 'Pesticide Test',
  microbials: 'Microbial Test'
};

const BATCH_LAB_DOCUMENT_HELPER_TEXT: Record<BatchLabDocumentKey, string> = {
  cannabinoids: 'Upload the PDF showing THC, CBD, and total cannabinoids.',
  pesticides: 'Upload the pesticide test PDF for this batch.',
  microbials: 'Upload the microbial test PDF for this batch.'
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_DOCUMENT_TYPES = ['application/pdf'];

export function createEmptyBatchLabDocuments(): BatchLabDocuments {
  return {};
}

export function hasBatchLabDocuments(documents: BatchLabDocuments): boolean {
  return Object.values(documents).some(Boolean);
}

interface BatchLabDocumentUploadersProps {
  value: BatchLabDocuments;
  onChange: (documents: BatchLabDocuments) => void;
  onError?: (message: string) => void;
}

export function BatchLabDocumentUploaders({ value, onChange, onError }: BatchLabDocumentUploadersProps) {
  const handleFileChange = async (key: BatchLabDocumentKey, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type)) {
      onError?.('Please upload PDF files for lab results.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      onError?.('Lab result PDFs must be 10MB or smaller.');
      event.target.value = '';
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    onChange({
      ...value,
      [key]: {
        label: BATCH_LAB_DOCUMENT_LABELS[key],
        fileName: file.name,
        mimeType: file.type,
        dataUrl,
        uploadedAt: new Date().toISOString()
      }
    });
  };

  const handleRemove = (key: BatchLabDocumentKey) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-medium text-gray-900">Lab Result Documents</h4>
        <p className="text-sm text-gray-600 mt-1">
          Upload the three lab PDFs growers typically receive before selling flower.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {(Object.keys(BATCH_LAB_DOCUMENT_LABELS) as BatchLabDocumentKey[]).map((key) => {
          const document = value[key];

          return (
            <div key={key} className="rounded-lg border border-gray-200 bg-white p-4 space-y-2">
              <label htmlFor={`lab-document-${key}`} className="block text-sm font-medium text-gray-700">
                {BATCH_LAB_DOCUMENT_LABELS[key]}
              </label>
              <p className="text-xs text-gray-500">{BATCH_LAB_DOCUMENT_HELPER_TEXT[key]}</p>
              <input
                id={`lab-document-${key}`}
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => handleFileChange(key, event)}
                className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-green-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-green-700 hover:file:bg-green-100"
              />
              {document && (
                <div className="flex flex-col gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800 sm:flex-row sm:items-center sm:justify-between">
                  <span className="truncate">Uploaded: {document.fileName}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(key)}
                    className="text-left font-medium text-green-700 hover:text-green-900 sm:text-right"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
