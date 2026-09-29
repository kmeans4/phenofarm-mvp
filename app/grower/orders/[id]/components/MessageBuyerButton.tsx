'use client';

import { useState } from 'react';
import { Loader2, MessageCircle } from 'lucide-react';
import { toast } from '@/app/hooks/useToast';

interface MessageBuyerButtonProps {
  buyerName: string;
  dispensaryId: string;
  orderId?: string;
  statusLabel?: string;
  quoteProductId?: string;
}

export default function MessageBuyerButton({
  buyerName,
  dispensaryId,
  orderId,
  statusLabel,
  quoteProductId,
}: MessageBuyerButtonProps) {
  const [isOpening, setIsOpening] = useState(false);

  const openBuyerMessage = async () => {
    setIsOpening(true);

    try {
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispensaryId }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || 'We could not open buyer chat. Please try again.'
        );
      }

      window.dispatchEvent(
        new CustomEvent('phenofarm-open-chat', {
          detail: {
            conversationId: data.conversationId,
            quoteProductId,
            draft: orderId
              ? `Hi ${buyerName}, I have a question about order #${orderId}.`
              : `Hi ${buyerName}, `,
            context: [
              { label: 'Order', value: `#${orderId}` },
              { label: 'Status', value: statusLabel || '' },
              { label: 'Buyer', value: buyerName },
            ],
          },
        })
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'We could not open buyer chat. Please try again.'
      );
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={openBuyerMessage}
      disabled={isOpening}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-pf-accent-line bg-pf-accent-bg px-3 py-2 text-sm font-semibold text-pf-accent transition-colors hover:bg-pf-accent-bg disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2"
    >
      {isOpening ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
      )}
      {isOpening ? 'Opening messages...' : 'Message'}
    </button>
  );
}
