'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileUp, Loader2, LockKeyhole } from 'lucide-react';
import { Modal } from '@/app/components/ui/Modal';

type Preview = { totalRows: number; validRows: number; errorRows: number; records?: Array<{ row: number; name: string; productType: string | null; price: number }>; errors?: Array<{ row: number; field: string; message: string }> };

export function ProductCsvImportDialog({ enabled, onImported }: { enabled: boolean; onImported: () => void }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function upload(dryRun: boolean) {
    if (!file) return;
    setBusy(true); setMessage('');
    const body = new FormData(); body.set('file', file); if (dryRun) body.set('dryRun', 'true');
    const response = await fetch('/api/products/bulk', { method: 'POST', body });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (dryRun) { setPreview(data); if (!response.ok && !data.errors) setMessage(data.error || 'Could not validate CSV'); return; }
    if (!response.ok) return setMessage(data.error || 'Import failed');
    setMessage(`${data.successCount} products imported`); onImported();
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-pf-line-strong bg-pf-surface px-4 text-sm font-semibold text-pf-secondary hover:bg-pf-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent sm:w-auto"><FileUp className="h-4 w-4" />Import CSV{!enabled && <LockKeyhole className="h-3.5 w-3.5" />}</button>
    <Modal open={open} onClose={() => setOpen(false)} title="Import products from CSV" className="max-w-2xl">
        <p className="text-sm text-pf-muted">Preview and validate rows before importing.</p>
        {!enabled ? <div className="mt-5 rounded-lg border border-pf-warning-line bg-pf-warning-bg p-4 text-sm text-pf-warning"><p className="font-semibold">CSV import is available on Pro and Business.</p><Link href="/grower/pricing" className="mt-2 inline-flex font-semibold underline">Compare plans</Link></div> : <>
          <div className="mt-4 space-y-3">
            <Link href="/api/products/bulk?template=true" className="inline-flex min-h-10 items-center text-sm font-semibold text-pf-accent underline">Download CSV template</Link>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input aria-label="CSV file" type="file" accept=".csv,text/csv" onChange={(e) => { setFile(e.target.files?.[0] || null); setPreview(null); }} className="min-w-0 w-full flex-1 rounded-lg border border-pf-line bg-pf-canvas p-2 text-sm text-pf-secondary file:mr-3 file:rounded-md file:border-0 file:bg-pf-raised file:px-3 file:py-2 file:text-sm file:font-medium file:text-pf-text" />
              <button disabled={!file || busy} onClick={() => upload(true)} className="h-10 shrink-0 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-[#032116] hover:bg-emerald-400 disabled:opacity-50">{busy ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Validating…</span> : 'Preview rows'}</button>
            </div>
          </div>
          {preview ? <div className="mt-4"><p className="text-sm font-semibold text-pf-text">{preview.validRows} ready · {preview.errorRows} errors · {preview.totalRows} total</p><div className="mt-3 max-h-64 overflow-auto rounded-lg border border-pf-line"><table className="w-full text-sm"><thead className="bg-pf-canvas"><tr><th className="p-2 text-left">Row</th><th className="p-2 text-left">Result</th><th className="p-2 text-left">Details</th></tr></thead><tbody>{preview.records?.map((r) => <tr key={`r-${r.row}`} className="border-t border-pf-line"><td className="p-2">{r.row}</td><td className="p-2 text-pf-accent">Create</td><td className="p-2 break-words">{r.name} · {r.productType || 'No type'} · ${r.price}</td></tr>)}{preview.errors?.map((r, i) => <tr key={`e-${r.row}-${i}`} className="border-t border-pf-line bg-pf-danger-bg"><td className="p-2">{r.row}</td><td className="p-2 text-pf-danger">Error</td><td className="p-2 break-words">{r.field}: {r.message}</td></tr>)}</tbody></table></div>{preview.errorRows === 0 ? <button disabled={busy} onClick={() => upload(false)} className="mt-4 h-10 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-[#032116] hover:bg-emerald-400 disabled:opacity-50">Commit import</button> : null}</div> : null}
        </>}
        {message ? <p role="status" className="mt-4 text-sm font-semibold text-pf-secondary">{message}</p> : null}
    </Modal>
  </>;
}
