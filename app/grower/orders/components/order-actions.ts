'use client';
import { toast } from '@/app/hooks/useToast';
import { getOrderStatusLabel } from '@/lib/order-workflow';
export const NEXT_ORDER_ACTION: Record<
  string,
  { status: string; label: string }
> = {
  PENDING: { status: 'CONFIRMED', label: 'Accept' },
  CONFIRMED: { status: 'PROCESSING', label: 'Start preparing' },
  PROCESSING: { status: 'SHIPPED', label: 'Mark on the way' },
  SHIPPED: { status: 'DELIVERED', label: 'Mark delivered' },
};
export async function changeOrderStatus(
  id: string,
  status: string,
  expectedStatus: string,
  reason?: string
) {
  const response = await fetch(`/api/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, expectedStatus, reason }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data.error || 'Could not update the order. Try again.');
  return data.undoEventId as string | undefined;
}
export function offerOrderUndo(
  changes: { id: string; eventId: string }[],
  status: string,
  refresh: () => void
) {
  toast.success(
    `${changes.length > 1 ? `${changes.length} orders` : 'Order'} ${getOrderStatusLabel(status).toLowerCase()}`,
    {
      duration: 8000,
      action: {
        label: 'Undo',
        onClick: async () => {
          const results = await Promise.allSettled(
            changes.map(async (change) => {
              const res = await fetch(`/api/orders/${change.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ undoEventId: change.eventId }),
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok)
                throw new Error(
                  data.error || 'Undo failed. Refresh the order.'
                );
            })
          );
          const failure = results.find(
            (result) => result.status === 'rejected'
          );
          if (failure?.status === 'rejected')
            toast.error(failure.reason.message);
          else toast.success('Update undone');
          refresh();
        },
      },
    }
  );
}
