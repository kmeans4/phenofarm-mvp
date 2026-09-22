'use client';

import { useState } from 'react';
import { Loader2, MessageCircle } from 'lucide-react';
import { toast } from '@/app/hooks/useToast';

interface MessageBuyerButtonProps {
  buyerName: string;
  dispensaryId: string;
  orderId: string;
  statusLabel: string;
}

export default function MessageBuyerButton({
  buyerName,
  dispensaryId,
  orderId,
  statusLabel,
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
        throw new Error(data.error || 'Failed to open buyer chat');
      }

      window.dispatchEvent(
        new CustomEvent('phenofarm-open-chat', {
          detail: {
            conversationId: data.conversationId,
            draft: `Hi ${buyerName}, I have a question about request #${orderId}.`,
            context: [
              { label: 'Order', value: `#${orderId}` },
              { label: 'Status', value: statusLabel },
              { label: 'Buyer', value: buyerName },
            ],
          },
        }),
      );
      toast.success('Draft ready in messages');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to open buyer chat');
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={openBuyerMessage}
      disabled={isOpening}
      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
    >
      {isOpening ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
      )}
      {isOpening ? 'Opening messages...' : 'Message buyer'}
    </button>
  );
}
