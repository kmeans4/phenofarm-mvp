'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Modal } from '@/app/components/ui/Modal';
import { Button } from '@/app/components/ui/Button';
export type VerificationRow = {
  id: string;
  kind: 'grower' | 'dispensary';
  businessName: string;
  email: string | null;
  licenseNumber: string | null;
  licenseExpiry: string;
  state: string | null;
  status: string;
  canApprove: boolean;
  reviewKey: string;
  updatedAt: string;
  previousLicenseNumber?: string | null;
};
export function VerificationQueue({
  rows,
  showDetails = true,
}: {
  rows: VerificationRow[];
  showDetails?: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [declining, setDeclining] = useState<VerificationRow | null>(null);
  const [reason, setReason] = useState('Missing information');
  const [note, setNote] = useState('');
  async function decide(
    row: VerificationRow,
    decision: string,
    reasonText?: string
  ) {
    const url = `/admin/${row.kind === 'grower' ? 'growers' : 'dispensaries'}/${row.id}/verify`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision,
        reason: reasonText,
        expectedLicenseKey: row.reviewKey,
        expectedUpdatedAt: row.updatedAt,
      }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok)
      throw Error(result?.error || 'Could not save the decision.');
    toast.success(result.message, {
      duration: 8000,
      ...(result.undo
        ? {
            action: {
              label: 'Undo',
              onClick: () => {
                void fetch(url, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(result.undo),
                })
                  .then(async (response) => {
                    if (!response.ok)
                      throw Error((await response.json()).error);
                    toast.success('Decision undone');
                    router.refresh();
                  })
                  .catch((error) => toast.error(error.message));
              },
            },
          }
        : {}),
    });
  }
  async function run(items: VerificationRow[], decision: string) {
    setBusy(true);
    let saved = 0;
    try {
      for (const row of items) {
        await decide(
          row,
          decision,
          decision === 'decline'
            ? [reason, note.trim()].filter(Boolean).join(': ')
            : undefined
        );
        saved++;
      }
      setSelected([]);
      setDeclining(null);
    } catch (error) {
      toast.error(
        `${saved ? `${saved} saved. ` : ''}${error instanceof Error ? error.message : 'Could not save.'}`
      );
    } finally {
      setBusy(false);
      router.refresh();
    }
  }
  return (
    <div className="space-y-3">
      {rows.length > 1 && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={
                rows.filter((r) => r.canApprove).length > 0 &&
                rows
                  .filter((r) => r.canApprove)
                  .every((r) => selected.includes(r.id))
              }
              onChange={(e) =>
                setSelected(
                  e.target.checked
                    ? rows.filter((r) => r.canApprove).map((r) => r.id)
                    : []
                )
              }
            />
            Select eligible
          </label>
          <Button
            disabled={!selected.length || busy}
            onClick={() =>
              run(
                rows.filter((r) => selected.includes(r.id)),
                'approve'
              )
            }
          >
            Verify selected ({selected.length})
          </Button>
        </div>
      )}
      {rows.map((row) => (
        <article
          key={row.id}
          className="flex flex-col gap-3 rounded-xl border border-pf-line bg-pf-surface p-4 sm:flex-row sm:items-center"
        >
          {showDetails && (
            <label className="flex min-h-11 items-center gap-3 sm:flex-1">
              <input
                type="checkbox"
                aria-label={`Select ${row.businessName}`}
                checked={selected.includes(row.id)}
                disabled={!row.canApprove || busy}
                onChange={(event) =>
                  setSelected((values) =>
                    event.target.checked
                      ? [...values, row.id]
                      : values.filter((id) => id !== row.id)
                  )
                }
              />
              <span className="min-w-0">
                <Link
                  href={`/admin/review/${row.kind}/${row.id}`}
                  className="block min-h-11 content-center font-semibold text-pf-accent"
                >
                  {row.businessName}
                </Link>
                <span className="block text-sm text-pf-muted">
                  {row.kind === 'grower' ? 'Grower' : 'Dispensary'} ·{' '}
                  {row.state || 'No state'} ·{' '}
                  {row.licenseNumber || 'Missing license number'}
                </span>
                <span className="block text-sm text-pf-secondary">
                  {row.status}
                  {row.licenseExpiry ? ` · Expires ${row.licenseExpiry}` : ''}
                </span>
                {row.previousLicenseNumber &&
                  row.previousLicenseNumber !== row.licenseNumber && (
                    <span className="block text-sm text-pf-warning">
                      License changed: {row.previousLicenseNumber} →{' '}
                      {row.licenseNumber}
                    </span>
                  )}
              </span>
            </label>
          )}
          <div className="flex flex-wrap gap-2">
            {showDetails && (
              <Link
                className="inline-flex min-h-11 items-center rounded-lg border border-pf-line-strong px-3 text-sm"
                href={`/admin/review/${row.kind}/${row.id}`}
              >
                Review
              </Link>
            )}
            {row.canApprove && (
              <Button disabled={busy} onClick={() => run([row], 'approve')}>
                Verify
              </Button>
            )}
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                setDeclining(row);
                setNote('');
                setReason(
                  row.status === 'Expired'
                    ? 'Expired license'
                    : 'Missing information'
                );
              }}
            >
              Request changes
            </Button>
          </div>
        </article>
      ))}
      <Modal
        open={Boolean(declining)}
        onClose={() => setDeclining(null)}
        title="Request license changes"
        dismissible={!busy}
      >
        <label className="mb-1 block text-sm" htmlFor="review-reason">
          Reason
        </label>
        <select
          id="review-reason"
          className="w-full rounded-lg border p-3"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        >
          {[
            'Missing information',
            'Expired license',
            'License not found',
            'Details do not match',
            'Other',
          ].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <label htmlFor="review-note" className="mb-1 mt-3 block text-sm">
          Note (optional)
        </label>
        <textarea
          id="review-note"
          value={note}
          maxLength={800}
          onChange={(event) => setNote(event.target.value)}
          className="w-full rounded-lg border p-3"
        />
        <Button
          className="mt-3 w-full"
          disabled={busy}
          onClick={() => declining && run([declining], 'decline')}
        >
          {busy ? 'Saving…' : 'Send changes needed'}
        </Button>
      </Modal>
    </div>
  );
}
