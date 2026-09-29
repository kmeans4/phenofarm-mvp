'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import {
  getOrderStatusLabel,
  canTransitionOrderStatus,
} from '@/lib/order-workflow';
import { formatMoney, formatDate } from '@/lib/format';
import {
  NEXT_ORDER_ACTION,
  changeOrderStatus,
  offerOrderUndo,
} from './order-actions';
import { toast } from '@/app/hooks/useToast';
export type ListedOrder = {
  id: string;
  orderId: string;
  status: string;
  createdAt: string;
  totalAmount: number;
  dispensary: { businessName: string };
};
export default function OrdersList({
  initialOrders,
  history = false,
}: {
  initialOrders: ListedOrder[];
  history?: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState('CONFIRMED');
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  async function update(rows: ListedOrder[], status: string) {
    if (busy) return;
    if (
      status === 'CANCELLED' &&
      (!reason.trim() || (reason === 'Other' && !otherReason.trim()))
    ) {
      toast.error('Choose a cancellation reason.');
      return;
    }
    setBusy(true);
    const results = await Promise.allSettled(
      rows.map(async (row) => ({
        id: row.id,
        eventId: await changeOrderStatus(
          row.id,
          status,
          row.status,
          reason === 'Other' ? `Other: ${otherReason}` : reason
        ),
      }))
    );
    const successes = results.flatMap((x) =>
      x.status === 'fulfilled' && x.value.eventId
        ? [{ id: x.value.id, eventId: x.value.eventId }]
        : []
    );
    if (successes.length)
      offerOrderUndo(successes, status, () => router.refresh());
    const rejected = results.find((x) => x.status === 'rejected');
    if (rejected?.status === 'rejected') toast.error(rejected.reason.message);
    setSelected([]);
    setBusy(false);
    router.refresh();
  }
  if (!initialOrders.length)
    return (
      <div className="rounded-xl border border-pf-line p-6 text-center">
        <h2 className="font-semibold">No matching orders</h2>
        <Button className="mt-3" asChild>
          <Link href="/grower/orders/add">Record order</Link>
        </Button>
      </div>
    );
  return (
    <div className="space-y-3">
      {!history && (
        <label className="inline-flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="h-5 w-5 accent-emerald-500"
            checked={selected.length === initialOrders.length}
            onChange={(e) =>
              setSelected(
                e.target.checked ? initialOrders.map((x) => x.id) : []
              )
            }
          />
          Select this page
        </label>
      )}
      <div className="divide-y divide-pf-line overflow-hidden rounded-xl border border-pf-line bg-pf-surface">
        {initialOrders.map((order) => (
          <article
            key={order.id}
            className="flex flex-wrap items-center gap-3 p-3 sm:p-4"
          >
            {!history && (
              <label className="flex h-11 w-11 shrink-0 items-center justify-center">
                <span className="sr-only">Select order {order.orderId}</span>
                <input
                  className="h-5 w-5 accent-emerald-500"
                  type="checkbox"
                  checked={selected.includes(order.id)}
                  onChange={(e) =>
                    setSelected((prev) =>
                      e.target.checked
                        ? [...prev, order.id]
                        : prev.filter((x) => x !== order.id)
                    )
                  }
                />
              </label>
            )}
            <Link
              href={`/grower/orders/${order.id}`}
              className="min-w-0 flex-1 rounded-lg py-1 text-sm"
            >
              <span className="font-semibold text-pf-accent break-words">
                #{order.orderId} · {order.dispensary.businessName}
              </span>
              <span className="mt-1 block text-pf-muted">
                {formatDate(order.createdAt)} ·{' '}
                {getOrderStatusLabel(order.status)}
              </span>
            </Link>
            <strong className="text-sm tabular-nums">
              {formatMoney(order.totalAmount)}
            </strong>
            {history ? (
              <Button asChild variant="outline">
                <Link href={`/grower/orders/add?from=${order.id}`}>Repeat</Link>
              </Button>
            ) : (
              NEXT_ORDER_ACTION[order.status] && (
                <Button
                  disabled={busy}
                  className="ml-auto"
                  onClick={() =>
                    void update([order], NEXT_ORDER_ACTION[order.status].status)
                  }
                >
                  {NEXT_ORDER_ACTION[order.status].label}
                </Button>
              )
            )}
          </article>
        ))}
      </div>
      {selected.length > 0 && (
        <div className="sticky bottom-20 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-pf-line-strong bg-pf-surface p-3 shadow-lg lg:bottom-3">
          <span className="text-sm font-medium">
            {selected.length} selected
          </span>
          <label className="sr-only" htmlFor="bulk-status">
            Status
          </label>
          <select
            id="bulk-status"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="min-h-11 rounded-lg border border-pf-line-strong bg-pf-raised p-2"
          >
            {[
              'CONFIRMED',
              'PROCESSING',
              'SHIPPED',
              'DELIVERED',
              'CANCELLED',
            ].map((x) => (
              <option key={x} value={x}>
                {getOrderStatusLabel(x)}
              </option>
            ))}
          </select>
          {target === 'CANCELLED' && (
            <>
              <label className="sr-only" htmlFor="bulk-reason">
                Reason
              </label>
              <select
                id="bulk-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-11 rounded-lg border border-pf-line-strong bg-pf-raised p-2"
              >
                <option value="">Choose reason</option>
                {['Out of stock', 'Buyer asked', "Can't deliver", 'Other'].map(
                  (x) => (
                    <option key={x}>{x}</option>
                  )
                )}
              </select>
              {reason === 'Other' && (
                <input
                  aria-label="Other cancellation reason"
                  className="min-h-11 rounded-lg border border-pf-line-strong bg-pf-raised p-2"
                  placeholder="Describe the reason"
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                />
              )}
            </>
          )}
          <Button
            variant={target === 'CANCELLED' ? 'destructive' : 'primary'}
            disabled={busy}
            onClick={() => {
              const rows = initialOrders.filter(
                (x) =>
                  selected.includes(x.id) &&
                  x.status !== target &&
                  canTransitionOrderStatus(x.status, target)
              );
              if (!rows.length)
                toast.error('Selected orders cannot move to that status.');
              else {
                const skipped = selected.length - rows.length;
                if (skipped)
                  toast.info(`${skipped} orders skipped: different stage`);
                void update(rows, target);
              }
            }}
          >
            {busy
              ? 'Saving…'
              : target === 'CANCELLED'
                ? 'Confirm cancellation'
                : 'Update selected'}
          </Button>
          <Button variant="outline" onClick={() => setSelected([])}>
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
