'use client';
import Link from 'next/link';
import type { GrowerAttentionSummary } from '@/lib/grower-attention';
import { Button } from '@/app/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  changeOrderStatus,
  offerOrderUndo,
} from '../orders/components/order-actions';
import { toast } from '@/app/hooks/useToast';
export function GrowerAttentionPanel({
  summary,
}: {
  summary: GrowerAttentionSummary;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  return (
    <section
      className="pf-panel p-4 sm:p-5"
      data-testid="grower-attention-panel"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">
          Needs attention{' '}
          <span className="text-pf-muted" data-testid="grower-attention-total">
            {summary.counts.totalAttention}
          </span>
        </h2>
        {summary.counts.pendingRequests > 0 && (
          <Link
            href="/grower/orders?view=needs-review"
            className="inline-flex min-h-11 items-center text-sm text-pf-accent"
          >
            Review all orders
          </Link>
        )}
      </div>
      {!summary.items.length ? (
        <p className="text-sm text-pf-muted">
          No new orders or unread messages.
        </p>
      ) : (
        <div className="divide-y divide-pf-line">
          {summary.items.map((item) => (
            <article
              key={item.id}
              className="flex flex-wrap items-center gap-3 py-3"
            >
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-pf-muted">{item.detail}</p>
              </div>
              {item.conversationId ? (
                <Button
                  variant="outline"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent('phenofarm-open-chat', {
                        detail: { conversationId: item.conversationId },
                      })
                    )
                  }
                >
                  Reply
                </Button>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link href={item.href}>Details</Link>
                  </Button>
                  {item.type === 'request' && (
                    <Button
                      disabled={!!busy}
                      onClick={async () => {
                        const id = item.href.split('/').pop()!;
                        setBusy(id);
                        try {
                          const eventId = await changeOrderStatus(
                            id,
                            'CONFIRMED',
                            'PENDING'
                          );
                          if (eventId)
                            offerOrderUndo([{ id, eventId }], 'CONFIRMED', () =>
                              router.refresh()
                            );
                          router.refresh();
                        } catch (e) {
                          toast.error(
                            e instanceof Error
                              ? e.message
                              : 'Could not accept order.'
                          );
                        } finally {
                          setBusy('');
                        }
                      }}
                    >
                      Accept
                    </Button>
                  )}
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
