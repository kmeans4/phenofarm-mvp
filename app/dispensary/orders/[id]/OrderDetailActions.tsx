'use client';

import { useState } from 'react';
import { BuyAgainButton } from '../../components/BuyAgainButton';
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

export function OrderDetailActions({
  orderDbId,
  orderId,
  status,
  growerId,
  growerName,
  items,
  createdBy,
  buyerAcknowledgedAt,
  isOffPlatform,
}: OrderDetailActionsProps) {
  const router = useRouter();
  const [messageStatus, setMessageStatus] = useState('');
  const [sendingAction, setSendingAction] = useState<
    'update' | 'cancel' | 'message' | 'withdraw' | null
  >(null);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const canWithdraw = status === 'PENDING';
  const needsAcknowledgment =
    createdBy === 'GROWER' &&
    status === 'PENDING' &&
    !buyerAcknowledgedAt &&
    !isOffPlatform;
  const canRequestCancellation = [
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
  ].includes(status);
  const canRequestUpdate = !['DELIVERED', 'CANCELLED'].includes(status);

  const sendGrowerMessage = async (kind: 'update' | 'cancel' | 'message') => {
    const bodyByKind = {
      update: `Hi ${growerName}, can you share an update on order #${orderId}?`,
      cancel: `Hi ${growerName}, please review whether order #${orderId} can be cancelled before pickup or delivery.`,
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
        throw new Error(
          data.error || 'We could not open grower chat. Please try again.'
        );
      }

      setMessageStatus('Message ready. Review it in Messages, then send.');
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
      setMessageStatus(
        error instanceof Error ? error.message : 'Failed to open grower chat.'
      );
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
        throw new Error(data.error || 'Unable to withdraw this order.');
      }

      setShowWithdrawConfirm(false);
      setMessageStatus('Order withdrawn.');
      router.refresh();
    } catch (error) {
      setMessageStatus(
        error instanceof Error
          ? error.message
          : 'Unable to withdraw this order.'
      );
    } finally {
      setSendingAction(null);
    }
  };

  const confirmRecordedRequest = async () => {
    setSendingAction('update');
    setMessageStatus('');
    try {
      const response = await fetch(`/api/orders/${orderDbId}/acknowledge`, {
        method: 'PATCH',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.error || 'Unable to confirm order.');
      setMessageStatus('Order confirmed. The grower has been notified.');
      router.refresh();
    } catch (error) {
      setMessageStatus(
        error instanceof Error
          ? error.message
          : 'Could not confirm. Check your connection and retry.'
      );
    } finally {
      setSendingAction(null);
    }
  };

  return (
    <div className="rounded-xl border border-pf-line bg-pf-surface p-4 shadow-sm">
      <h2 className="sr-only">Order actions</h2>
      {createdBy === 'GROWER' ? (
        <p className="mt-2 inline-flex rounded-full bg-pf-info-bg px-3 py-1 text-xs font-semibold text-pf-info">
          {isOffPlatform
            ? 'Recorded outside PhenoShop'
            : buyerAcknowledgedAt
              ? 'Recorded by grower · Confirmed'
              : 'Recorded by grower'}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 [&>button]:min-h-10">
        {needsAcknowledgment ? (
          <button
            type="button"
            onClick={confirmRecordedRequest}
            disabled={sendingAction !== null}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#032116] hover:bg-emerald-400 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            Confirm order
          </button>
        ) : null}
        <button
          type="button"
          onClick={() =>
            sendGrowerMessage(canRequestUpdate ? 'update' : 'message')
          }
          disabled={sendingAction !== null}
          className="rounded-lg border border-pf-line-strong px-4 py-2 text-sm font-medium text-pf-secondary hover:bg-pf-canvas disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
        >
          {sendingAction === 'message' || sendingAction === 'update'
            ? 'Opening...'
            : 'Message grower'}
        </button>

        {canWithdraw && (
          <button
            type="button"
            onClick={() => setShowWithdrawConfirm(true)}
            disabled={sendingAction !== null}
            className="rounded-lg border border-pf-danger-line bg-pf-danger-bg px-4 py-2 text-sm font-semibold text-pf-danger hover:bg-pf-danger-bg disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
          >
            {sendingAction === 'withdraw' ? 'Withdrawing...' : 'Withdraw order'}
          </button>
        )}

        {canRequestCancellation && (
          <button
            type="button"
            onClick={() => sendGrowerMessage('cancel')}
            disabled={sendingAction !== null}
            className="rounded-lg border border-pf-danger-line bg-pf-danger-bg px-4 py-2 text-sm font-medium text-pf-danger hover:bg-pf-danger-bg disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
          >
            {sendingAction === 'cancel' ? 'Opening...' : 'Ask to cancel'}
          </button>
        )}

        <BuyAgainButton
          items={items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          }))}
        />
      </div>

      {messageStatus && (
        <p className="mt-3 rounded-lg bg-pf-canvas px-3 py-2 text-sm text-pf-secondary">
          {messageStatus}
        </p>
      )}

      <ConfirmDialog
        open={showWithdrawConfirm}
        title="Withdraw this order?"
        description="The grower has not accepted this order yet. Withdraw it now?"
        confirmLabel={
          sendingAction === 'withdraw' ? 'Withdrawing...' : 'Withdraw order'
        }
        intent="danger"
        onConfirm={withdrawRequest}
        onCancel={() => {
          if (sendingAction !== 'withdraw') setShowWithdrawConfirm(false);
        }}
      />
    </div>
  );
}
