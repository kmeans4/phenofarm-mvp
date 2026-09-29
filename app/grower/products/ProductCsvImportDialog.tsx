'use client';
import { useState } from 'react';
import Link from 'next/link';
import { FileUp } from 'lucide-react';
import { Modal } from '@/app/components/ui/Modal';
import { formatProductMoney } from '@/lib/product-display';
import { validateCsvImportFile } from '@/lib/upload-validation';

type Preview = {
  totalRows: number;
  validRows: number;
  errorRows: number;
  createCount: number;
  updateCount: number;
  failedRowsCsv?: string;
  records?: Array<{
    row: number;
    action: string;
    name: string;
    productType: string | null;
    price: number;
  }>;
  errors?: Array<{ row: number; field: string; message: string }>;
};
export function ProductCsvImportDialog({
  enabled,
  onImported,
}: {
  enabled: boolean;
  onImported: () => void;
}) {
  const [open, setOpen] = useState(false),
    [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState<'preview' | 'import' | null>(null),
    [message, setMessage] = useState(''),
    [version, setVersion] = useState(0);
  async function upload(dryRun: boolean) {
    if (!file) {
      setMessage('Choose a spreadsheet first.');
      return;
    }
    if (busy) return;
    setBusy(dryRun ? 'preview' : 'import');
    setMessage('');
    try {
      const body = new FormData();
      body.set('file', file);
      if (dryRun) body.set('dryRun', 'true');
      const response = await fetch('/api/products/bulk', {
        method: 'POST',
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (Number.isFinite(data.validRows) && Number.isFinite(data.errorRows))
        setPreview(data);
      if (!response.ok)
        throw new Error(
          data.error ||
            'Could not read this spreadsheet. Check the format and retry.'
        );
      if (!dryRun) {
        setMessage(
          `Created ${data.createCount} · Updated ${data.updateCount}${data.errorRows ? ` · Skipped ${data.errorRows}` : ''}`
        );
        setFile(null);
        setVersion((value) => value + 1);
        onImported();
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Connection lost. Try again.'
      );
    } finally {
      setBusy(null);
    }
  }
  function downloadFailed() {
    if (!preview?.failedRowsCsv) return;
    const url = URL.createObjectURL(
      new Blob([preview.failedRowsCsv], { type: 'text/csv;charset=utf-8' })
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products-needing-attention.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={!enabled ? 'Free includes up to 25 rows per import' : undefined}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-pf-line-strong px-3 text-sm font-medium"
      >
        <FileUp className="h-4 w-4" />
        Import spreadsheet
      </button>
      <Modal
        open={open}
        onClose={() => {
          if (!busy) setOpen(false);
        }}
        dismissible={!file && !busy}
        title="Import products"
        className="max-w-2xl"
      >
        <p className="text-sm text-pf-secondary">
          CSV, TSV or Excel · Up to 4MB. Matching SKU or name updates an
          existing product.
        </p>
        {!enabled && (
          <p className="mt-2 text-sm text-pf-muted">
            Free includes 25 rows per import.{' '}
            <Link className="underline" href="/grower/pricing">
              Compare plans
            </Link>
          </p>
        )}
        <Link
          href="/api/products/bulk?template=true"
          className="inline-flex min-h-11 items-center text-sm text-pf-accent underline"
        >
          Download template
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            key={version}
            aria-label="Product spreadsheet"
            type="file"
            accept=".csv,.tsv,.xlsx"
            disabled={Boolean(busy)}
            onChange={(event) => {
              const next = event.target.files?.[0] || null;
              const checked = next ? validateCsvImportFile(next) : null;
              setFile(checked?.ok ? next : null);
              setPreview(null);
              setMessage(checked && !checked.ok ? checked.error : '');
            }}
            className="min-w-0 flex-1 rounded-lg border border-pf-line-strong p-2 text-sm file:min-h-11"
          />
          <button
            disabled={Boolean(busy)}
            onClick={() => upload(true)}
            className="min-h-11 rounded-lg bg-pf-accent px-4 text-sm font-semibold text-pf-canvas"
          >
            {busy === 'preview' ? 'Checking…' : 'Preview'}
          </button>
        </div>
        {preview && (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium">
              Create {preview.createCount} · Update {preview.updateCount} · Skip{' '}
              {preview.errorRows}
            </p>
            <div className="max-h-64 overflow-auto rounded-lg border border-pf-line">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="p-2 text-left">Row</th>
                    <th className="p-2 text-left">Action</th>
                    <th className="p-2 text-left">Product</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.records?.map((row) => (
                    <tr key={row.row} className="border-t border-pf-line">
                      <td className="p-2">{row.row}</td>
                      <td className="p-2 capitalize">{row.action}</td>
                      <td className="p-2">
                        {row.name} · {formatProductMoney(row.price)}
                      </td>
                    </tr>
                  ))}
                  {preview.errors?.map((error, index) => (
                    <tr
                      key={`error-${index}`}
                      className="border-t border-pf-line text-pf-danger"
                    >
                      <td className="p-2">{error.row}</td>
                      <td className="p-2">Skip</td>
                      <td className="p-2">{error.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.failedRowsCsv && (
              <button
                onClick={downloadFailed}
                className="min-h-11 text-sm text-pf-accent underline"
              >
                Download skipped rows
              </button>
            )}
            {file && preview.validRows > 0 && (
              <button
                disabled={Boolean(busy)}
                onClick={() => upload(false)}
                className="block min-h-11 rounded-lg bg-pf-accent px-4 text-sm font-semibold text-pf-canvas"
              >
                {busy === 'import'
                  ? 'Importing…'
                  : `Import ${preview.validRows} good ${preview.validRows === 1 ? 'row' : 'rows'}${preview.errorRows ? `, skip ${preview.errorRows}` : ''}`}
              </button>
            )}
          </div>
        )}
        {message && (
          <p role="status" className="mt-4 text-sm">
            {message}
          </p>
        )}
      </Modal>
    </>
  );
}
