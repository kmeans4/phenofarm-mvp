'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileUp, Loader2, LockKeyhole, X } from 'lucide-react';

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
    <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 sm:w-auto"><FileUp className="h-4 w-4" />Import CSV{!enabled && <LockKeyhole className="h-3.5 w-3.5" />}</button>
    {open ? <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <section role="dialog" aria-modal="true" aria-labelledby="csv-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-2xl">
        <header className="flex items-start justify-between gap-3"><div><h2 id="csv-title" className="text-xl font-semibold text-gray-950">Import products from CSV</h2><p className="mt-1 text-sm text-gray-600">Validate every row before creating products.</p></div><button onClick={() => setOpen(false)} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-green-600"><X className="h-5 w-5" /></button></header>
        {!enabled ? <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-semibold">CSV import is available on Pro and Business.</p><Link href="/grower/pricing" className="mt-2 inline-flex font-semibold underline">Compare plans</Link></div> : <>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center"><Link href="/api/products/bulk?template=true" className="text-sm font-semibold text-green-700 underline">Download CSV template</Link><input type="file" accept=".csv,text/csv" onChange={(e) => { setFile(e.target.files?.[0] || null); setPreview(null); }} className="text-sm" /><button disabled={!file || busy} onClick={() => upload(true)} className="h-10 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Preview rows'}</button></div>
          {preview ? <div className="mt-5"><p className="text-sm font-semibold text-gray-900">{preview.validRows} ready · {preview.errorRows} errors · {preview.totalRows} total</p><div className="mt-3 max-h-64 overflow-auto rounded-lg border border-gray-200"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="p-2 text-left">Row</th><th className="p-2 text-left">Result</th><th className="p-2 text-left">Details</th></tr></thead><tbody>{preview.records?.map((r) => <tr key={`r-${r.row}`} className="border-t"><td className="p-2">{r.row}</td><td className="p-2 text-green-700">Create</td><td className="p-2">{r.name} · {r.productType || 'No type'} · ${r.price}</td></tr>)}{preview.errors?.map((r, i) => <tr key={`e-${r.row}-${i}`} className="border-t bg-red-50"><td className="p-2">{r.row}</td><td className="p-2 text-red-700">Error</td><td className="p-2">{r.field}: {r.message}</td></tr>)}</tbody></table></div>{preview.errorRows === 0 ? <button disabled={busy} onClick={() => upload(false)} className="mt-4 h-10 rounded-lg bg-green-700 px-4 text-sm font-semibold text-white">Commit import</button> : null}</div> : null}
        </>}
        {message ? <p role="status" className="mt-4 text-sm font-semibold text-gray-800">{message}</p> : null}
      </section>
    </div> : null}
  </>;
}
