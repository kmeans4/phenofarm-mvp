import { format } from 'date-fns';
import { getOrderStatusLabel } from '@/lib/order-workflow';

export interface OrderHistoryEvent {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  actorRole: string | null;
  createdAt: Date | string;
}

export function OrderHistory({ events }: { events: OrderHistoryEvent[] }) {
  return <section className="rounded-xl border border-pf-line bg-pf-surface p-4 shadow-sm"><h2 className="font-semibold text-pf-text">History</h2>{events.length ? <ol className="mt-3 space-y-3 border-l border-pf-line pl-4">{events.map((event) => <li key={event.id} className="text-sm"><p className="font-medium text-pf-text">{event.fromStatus ? `${getOrderStatusLabel(event.fromStatus)} → ` : ''}{getOrderStatusLabel(event.toStatus)}</p><p className="mt-0.5 text-xs text-pf-muted">{event.actorRole ? event.actorRole.toLowerCase().replace(/^./, (c) => c.toUpperCase()) : 'System'} · {format(new Date(event.createdAt), 'MMM d, yyyy h:mm a')}</p></li>)}</ol> : <p className="mt-2 text-sm text-pf-muted">No recorded status changes yet.</p>}</section>;
}
