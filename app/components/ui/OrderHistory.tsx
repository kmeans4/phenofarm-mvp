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
  return <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><h2 className="font-semibold text-gray-900">History</h2>{events.length ? <ol className="mt-3 space-y-3 border-l border-gray-200 pl-4">{events.map((event) => <li key={event.id} className="text-sm"><p className="font-medium text-gray-900">{event.fromStatus ? `${getOrderStatusLabel(event.fromStatus)} → ` : ''}{getOrderStatusLabel(event.toStatus)}</p><p className="mt-0.5 text-xs text-gray-500">{event.actorRole ? event.actorRole.toLowerCase().replace(/^./, (c) => c.toUpperCase()) : 'System'} · {format(new Date(event.createdAt), 'MMM d, yyyy h:mm a')}</p></li>)}</ol> : <p className="mt-2 text-sm text-gray-500">No recorded status changes yet.</p>}</section>;
}
