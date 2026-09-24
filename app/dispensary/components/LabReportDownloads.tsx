'use client';

import { useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { LAB_REPORT_LABELS, labReportDownloadPath, normalizeLabReports, type LabReportKey } from '@/lib/lab-reports';

export function LabReportDownloads({ productId, productName, reports, className = '' }: {
  productId: string; productName: string; reports?: LabReportKey[]; className?: string;
}) {
  const [pending, setPending] = useState<LabReportKey | null>(null);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const available = normalizeLabReports(reports);
  if (!available.length) return null;

  async function download(report: LabReportKey) {
    if (busy.current) return;
    busy.current = true;
    setPending(report);
    setError('');
    try {
      const response = await fetch(labReportDownloadPath(productId, report));
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Could not download this report. Please try again.');
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `${productName.replace(/[^\w.\- ]/g, '').slice(0, 80) || 'Product'}-${LAB_REPORT_LABELS[report]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Allow the browser to start the save before releasing the temporary URL.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not download this report. Please try again.');
    } finally { busy.current = false; setPending(null); }
  }

  return <div className={className} data-lab-downloads>
    <div className="flex flex-wrap gap-1" role="group" aria-label={`Lab reports for ${productName}`}>
      {available.map(report => <button key={report} type="button" onClick={() => download(report)} disabled={pending !== null}
        aria-label={`Download ${LAB_REPORT_LABELS[report]} PDF for ${productName}`} title={`${LAB_REPORT_LABELS[report]} · PDF`}
        className="inline-flex min-h-10 max-w-full items-center gap-1.5 rounded-lg border border-pf-line px-2 py-1 text-xs font-medium text-pf-accent hover:bg-pf-accent-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent disabled:opacity-60">
        {pending === report ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
        <span className="break-words">{LAB_REPORT_LABELS[report]}</span>
      </button>)}
    </div>
    {error && <p role="alert" className="mt-1 text-xs text-pf-danger">{error}</p>}
  </div>;
}
