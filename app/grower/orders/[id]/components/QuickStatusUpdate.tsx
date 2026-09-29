'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import {
  NEXT_ORDER_ACTION,
  changeOrderStatus,
  offerOrderUndo,
} from '../../components/order-actions';
export default function QuickStatusUpdate({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState('');
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const action = NEXT_ORDER_ACTION[currentStatus];
  if (!action) return null;
  async function update(status: string) {
    if (pending.current) return;
    if (
      status === 'CANCELLED' &&
      (!reason || (reason === 'Other' && !note.trim()))
    ) {
      setError('Choose a reason and add a note for Other.');
      return;
    }
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      const eventId = await changeOrderStatus(
        orderId,
        status,
        currentStatus,
        status === 'CANCELLED'
          ? `${reason}${note.trim() ? `: ${note.trim()}` : ''}`
          : undefined
      );
      if (eventId)
        offerOrderUndo([{ id: orderId, eventId }], status, () =>
          router.refresh()
        );
      setDeclining(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update order.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="rounded-xl border border-pf-line bg-pf-surface p-4">
      <h2 className="mb-3 font-semibold">Next action</h2>
      {error && (
        <p role="alert" className="mb-3 text-sm text-pf-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => void update(action.status)}>
          {busy ? 'Saving…' : action.label}
        </Button>
        {currentStatus !== 'SHIPPED' && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => setDeclining(!declining)}
          >
            {currentStatus === 'PENDING' ? 'Decline' : 'Cancel order'}
          </Button>
        )}
      </div>
      {declining && (
        <div className="mt-3 space-y-3">
          <label className="block text-sm">
            Reason
            <select
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-pf-line-strong bg-pf-raised p-2"
            >
              <option value="">Choose a reason</option>
              {['Out of stock', 'Buyer asked', "Can't deliver", 'Other'].map(
                (x) => (
                  <option key={x}>{x}</option>
                )
              )}
            </select>
          </label>
          <label className="block text-sm">
            Note {reason !== 'Other' && '(optional)'}
            <textarea
              value={note}
              maxLength={400}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-lg border border-pf-line-strong bg-pf-raised p-2"
            />
          </label>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => void update('CANCELLED')}
            >
              Confirm {currentStatus === 'PENDING' ? 'decline' : 'cancellation'}
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setDeclining(false)}
            >
              Keep order
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
