'use client';

import { useState } from 'react';
import { readCart, writeCart, mergeCartItems } from '@/lib/cart';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/app/components/ui/ConfirmDialog';
import { getOrderStatusLabel } from '@/lib/order-workflow';

interface ReorderItem {
  productId: string;
  name: string;
  unit: string | null;
  strain: string | null;
  quantity: number;
  price: number | null;
  inventoryQty: number;
  isAvailable: boolean;
}

interface OrderDetailActionsProps {
  orderDbId: string;
  orderId: string;
  status: string;
  growerId: string;
  growerName: string;
  items: ReorderItem[];
  createdBy: string;
  buyerAcknowledgedAt: string | null;
  isOffPlatform: boolean;
}

export function OrderDetailActions({ orderDbId, orderId, status, growerId, growerName, items, createdBy, buyerAcknowledgedAt, isOffPlatform }: OrderDetailActionsProps) {
  const router = useRouter();
  const [messageStatus, setMessageStatus] = useState('');
  const [sendingAction, setSendingAction] = useState<'update' | 'cancel' | 'message' | 'withdraw' | null>(null);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const canWithdraw = status === 'PENDING';
  const needsAcknowledgment = createdBy === 'GROWER' && status === 'PENDING' && !buyerAcknowledgedAt && !isOffPlatform;
  const canRequestCancellation = ['CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(status);
  const canRequestUpdate = !['DELIVERED', 'CANCELLED'].includes(status);
  const canReorder = status === 'DELIVERED' && items.some((item) => item.isAvailable && item.inventoryQty > 0 && item.price != null);

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
            flash: true,
          },
        })
      );
    } catch (error) {
      setMessageStatus(error instanceof Error ? error.message : 'Failed to open grower chat.');
    } finally {
      setSendingAction(null);
    }
  };

  const withdrawRequest = async () => {
    if (sendingAction) return;

    setSendingAction('withdraw');
    setMessageStatus('');

    try {
      const response = await fetch(`/api/orders/${orderDbId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to withdraw this request.');
      }

      setShowWithdrawConfirm(false);
      setMessageStatus('Request withdrawn. Reserved inventory has been returned.');
      router.refresh();
    } catch (error) {
      setMessageStatus(error instanceof Error ? error.message : 'Unable to withdraw this request.');
    } finally {
      setSendingAction(null);
    }
  };

  const reorder = () => {
    const reorderItems = items
      .filter((item) => item.isAvailable && item.inventoryQty > 0 && item.price != null)
      .map((item) => ({
        id: item.productId,
        name: item.name,
        price: item.price ?? 0,
        grower: growerName,
        growerId,
        quantity: Math.min(item.quantity, item.inventoryQty),
        maxQty: item.inventoryQty,
        strain: item.strain || undefined,
        unit: item.unit || undefined,
      }));

    if (!writeCart(mergeCartItems(readCart(), reorderItems))) {
      setMessageStatus('Unable to save the request draft. Please free up browser storage and try again.'); return;
    }
    router.push('/dispensary/cart');
  };

  const confirmRecordedRequest = async () => {
    setSendingAction('update'); setMessageStatus('');
    const response = await fetch(`/api/orders/${orderDbId}/acknowledge`, { method: 'PATCH' });
    const data = await response.json().catch(() => ({})); setSendingAction(null);
    if (!response.ok) return setMessageStatus(data.error || 'Unable to confirm request.');
    setMessageStatus('Request confirmed. The grower has been notified.'); router.refresh();
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="sr-only">Buyer actions</h2>
      {createdBy === 'GROWER' ? <p className="mt-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">{isOffPlatform ? 'Off-platform record' : buyerAcknowledgedAt ? 'Recorded by grower · Confirmed' : 'Recorded by grower'}</p> : null}


      <div className="flex flex-wrap gap-2 [&>button]:min-h-10">
        {needsAcknowledgment ? <button type="button" onClick={confirmRecordedRequest} disabled={sendingAction !== null} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-green-600">Confirm request</button> : null}
        <button
          type="button"
          onClick={() => sendGrowerMessage(canRequestUpdate ? 'update' : 'message')}
          disabled={sendingAction !== null}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
        >
          {sendingAction === 'message' || sendingAction === 'update' ? 'Opening...' : 'Message grower'}
        </button>



        {canWithdraw && (
          <button
            type="button"
            onClick={() => setShowWithdrawConfirm(true)}
            disabled={sendingAction !== null}
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
          >
            {sendingAction === 'withdraw' ? 'Withdrawing...' : 'Withdraw request'}
          </button>
        )}

        {canRequestCancellation && (
          <button
            type="button"
            onClick={() => sendGrowerMessage('cancel')}
            disabled={sendingAction !== null}
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
          >
            {sendingAction === 'cancel' ? 'Opening...' : 'Ask to cancel'}
          </button>
        )}

        {status === 'DELIVERED' && (
          <button
            type="button"
            onClick={reorder}
            disabled={!canReorder}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
          >
            Reorder available items
          </button>
        )}
      </div>

      {messageStatus && (
        <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">{messageStatus}</p>
      )}

      <ConfirmDialog
        open={showWithdrawConfirm}
        title="Withdraw this request?"
        description="This cancels the request before acceptance and returns reserved stock to the grower."
        confirmLabel={sendingAction === 'withdraw' ? 'Withdrawing...' : 'Withdraw request'}
        intent="danger"
        onConfirm={withdrawRequest}
        onCancel={() => {
          if (sendingAction !== 'withdraw') setShowWithdrawConfirm(false);
        }}
      />
    </div>
  );
}
