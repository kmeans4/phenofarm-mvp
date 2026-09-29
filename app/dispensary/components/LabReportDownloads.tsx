'use client';

import { useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import {
  LAB_REPORT_LABELS,
  labReportDownloadPath,
  normalizeLabReports,
  type LabReportKey,
} from '@/lib/lab-reports';

export function LabReportDownloads({
  productId,
  productName,
  reports,
  audience = 'dispensary',
  className = '',
  showHeading = true,
}: {
  productId: string;
  productName: string;
  reports?: LabReportKey[];
  audience?: 'dispensary' | 'grower';
  className?: string;
  showHeading?: boolean;
}) {
  const [pending, setPending] = useState<LabReportKey | null>(null);
  const [error, setError] = useState('');
  const [started, setStarted] = useState<LabReportKey | null>(null);
  const busy = useRef(false);
  const available = normalizeLabReports(reports);
  if (!available.length) return null;

  async function download(report: LabReportKey) {
    if (busy.current) return;
    busy.current = true;
    setPending(report);
    setError('');
    setStarted(null);
    try {
      const response = await fetch(
        labReportDownloadPath(productId, report, audience),
        { signal: AbortSignal.timeout(20_000) }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.error || 'Could not download this report. Please try again.'
        );
      }
      if (
        !response.headers
          .get('content-type')
          ?.toLowerCase()
          .startsWith('application/pdf')
      ) {
        throw new Error(
          'This report could not be downloaded. Please sign in again and retry.'
        );
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `${productName.replace(/[^\w.\- ]/g, '').slice(0, 80) || 'Product'}-${LAB_REPORT_LABELS[report]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setStarted(report);
      // Allow the browser to start the save before releasing the temporary URL.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (failure) {
      setError(
        failure instanceof Error && failure.name === 'TimeoutError'
          ? 'This report is taking too long to download. Please try again.'
          : failure instanceof Error
            ? failure.message
            : 'Could not download this report. Please try again.'
      );
    } finally {
      busy.current = false;
      setPending(null);
    }
  }

  return (
    <div className={className} data-lab-downloads>
      {showHeading && (
        <h3 className="mb-1 text-sm font-semibold">Lab results</h3>
      )}
      <div
        className="flex flex-wrap gap-1"
        role="group"
        aria-label={`Lab reports for ${productName}`}
      >
        {available.map((report) => (
          <div
            key={report}
            className="flex min-w-0 max-w-full flex-wrap items-center gap-1"
          >
            <a
              href={`${labReportDownloadPath(productId, report, audience)}?view=inline`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 max-w-full items-center rounded-lg border border-pf-line-strong px-3 text-sm text-pf-accent"
              aria-label={`Open ${LAB_REPORT_LABELS[report]} PDF for ${productName}`}
            >
              {LAB_REPORT_LABELS[report]} ↗
            </a>
            <button
              key={report}
              type="button"
              onClick={() => download(report)}
              disabled={pending !== null}
              aria-label={`Download ${LAB_REPORT_LABELS[report]} PDF for ${productName}`}
              title={`${LAB_REPORT_LABELS[report]} · PDF`}
              className="inline-flex min-h-11 min-w-11 max-w-full items-center justify-center gap-1.5 rounded-lg border border-pf-line-strong px-2 py-1 text-sm font-medium text-pf-accent hover:bg-pf-accent-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent disabled:opacity-60"
            >
              {pending === report ? (
                <Loader2
                  className="h-3.5 w-3.5 shrink-0 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              )}
              <span className="sr-only">
                Download {LAB_REPORT_LABELS[report]}
              </span>
            </button>
          </div>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs text-pf-danger">
          {error}
        </p>
      )}
      {started && (
        <p role="status" className="mt-1 text-xs text-pf-muted">
          {LAB_REPORT_LABELS[started]} PDF sent to your browser. Check Downloads
          for its status.
        </p>
      )}
    </div>
  );
}
