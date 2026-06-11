'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOrderStatusLabel } from '@/lib/order-workflow';

interface ReorderItem {
  productId: string;
  name: string;
  unit: string | null;
  strain: string | null;
  quantity: number;
  price: number;
  inventoryQty: number;
  isAvailable: boolean;
}

interface OrderDetailActionsProps {
  orderId: string;
  status: string;
  growerId: string;
  growerName: string;
  items: ReorderItem[];
}

function calculateTotals(items: Array<{ price: number; quantity: number }>) {
  // PhenoFarm never calculates or collects tax on wholesale requests
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { subtotal, tax: 0, total: subtotal };
}

export function OrderDetailActions({ orderId, status, growerId, growerName, items }: OrderDetailActionsProps) {
  const router = useRouter();
  const [messageStatus, setMessageStatus] = useState('');
  const [sendingAction, setSendingAction] = useState<'update' | 'cancel' | 'message' | null>(null);
  const canRequestCancel = status === 'PENDING';
  const canRequestUpdate = !['DELIVERED', 'CANCELLED'].includes(status);
  const canReorder = status === 'DELIVERED' && items.some((item) => item.isAvailable && item.inventoryQty > 0);

  const sendGrowerMessage = async (kind: 'update' | 'cancel' | 'message') => {
    const bodyByKind = {
      update: `Hi ${growerName}, can you share an update on order #${orderId}?`,
      cancel: `Hi ${growerName}, please review whether order #${orderId} can be cancelled before fulfillment.`,
      message: `Hi ${growerName}, I have a question about order #${orderId}.`,
    };

    setSendingAction(kind);
    setMessageStatus('');

    try {
      // Create or reuse the conversation without sending anything yet —
      // the chat opens with a prefilled draft the buyer can edit first.
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ growerId }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to open grower chat');
      }

      setMessageStatus('Draft ready — review and send it in the chat panel.');
      window.dispatchEvent(
        new CustomEvent('phenofarm-open-chat', {
          detail: {
            conversationId: data.conversationId,
            draft: bodyByKind[kind],
            context: [
              { label: 'Order', value: `#${orderId}` },
              { label: 'Status', value: getOrderStatusLabel(status) },
              { label: 'Grower', value: growerName },
            ],
          },
        })
      );
    } catch (error) {
      setMessageStatus(error instanceof Error ? error.message : 'Failed to open grower chat.');
    } finally {
      setSendingAction(null);
    }
  };

  const reorder = () => {
    const reorderItems = items
      .filter((item) => item.isAvailable && item.inventoryQty > 0)
      .map((item) => ({
        id: item.productId,
        name: item.name,
        price: item.price,
        grower: growerName,
        growerId,
        quantity: Math.min(item.quantity, item.inventoryQty),
        maxQty: item.inventoryQty,
        strain: item.strain || undefined,
        unit: item.unit || undefined,
      }));

    const totals = calculateTotals(reorderItems);
    localStorage.setItem('phenofarm-cart', JSON.stringify({ items: reorderItems, ...totals }));
    window.dispatchEvent(new Event('cart-updated'));
    router.push('/dispensary/cart');
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">Buyer Actions</h2>
      <p className="mt-1 text-sm text-gray-600">Follow up with {growerName} or rebuild this order from available inventory.</p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => sendGrowerMessage('message')}
          disabled={sendingAction !== null}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {sendingAction === 'message' ? 'Opening...' : 'Message Grower'}
        </button>

        {canRequestUpdate && (
          <button
            type="button"
            onClick={() => sendGrowerMessage('update')}
            disabled={sendingAction !== null}
            className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          >
            {sendingAction === 'update' ? 'Opening...' : 'Request Update'}
          </button>
        )}

        {canRequestCancel && (
          <button
            type="button"
            onClick={() => sendGrowerMessage('cancel')}
            disabled={sendingAction !== null}
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            {sendingAction === 'cancel' ? 'Opening...' : 'Request Cancellation'}
          </button>
        )}

        {status === 'DELIVERED' && (
          <button
            type="button"
            onClick={reorder}
            disabled={!canReorder}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reorder Available Items
          </button>
        )}
      </div>

      {messageStatus && (
        <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">{messageStatus}</p>
      )}
    </div>
  );
}
