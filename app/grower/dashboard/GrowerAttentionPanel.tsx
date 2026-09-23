'use client';

import Link from 'next/link';
import type { GrowerAttentionItem, GrowerAttentionSummary } from '@/lib/grower-attention';

interface GrowerAttentionPanelProps {
  summary: GrowerAttentionSummary;
}

const toneClasses: Record<GrowerAttentionItem['tone'], string> = {
  yellow: 'border-pf-warning-line bg-pf-warning-bg text-pf-warning',
  blue: 'border-pf-info-line bg-pf-info-bg text-pf-info',
  green: 'border-pf-accent-line bg-pf-accent-bg text-pf-accent',
  red: 'border-pf-danger-line bg-pf-danger-bg text-pf-danger',
};

const badgeClasses: Record<GrowerAttentionItem['tone'], string> = {
  yellow: 'bg-pf-warning-bg text-pf-warning ring-pf-warning-line',
  blue: 'bg-pf-info-bg text-pf-info ring-pf-info-line',
  green: 'bg-pf-accent-bg text-pf-accent ring-pf-accent-line',
  red: 'bg-pf-danger-bg text-pf-danger ring-pf-danger-line',
};

function openConversation(conversationId: string) {
  window.dispatchEvent(
    new CustomEvent('phenofarm-open-chat', {
      detail: { conversationId },
    }),
  );
}

function AttentionAction({ item }: { item: GrowerAttentionItem }) {
  if (item.conversationId) {
    return (
      <button
        type="button"
        onClick={() => openConversation(item.conversationId as string)}
        className="mt-2 inline-flex min-h-10 items-center justify-center rounded-lg bg-pf-surface px-3 text-sm font-semibold text-pf-info shadow-sm ring-1 ring-pf-info-line transition hover:bg-pf-info-bg sm:mt-3"
      >
        Open message
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      className="mt-2 inline-flex min-h-10 items-center justify-center rounded-lg bg-pf-surface px-3 text-sm font-semibold text-pf-secondary shadow-sm ring-1 ring-pf-line transition hover:bg-pf-canvas sm:mt-3"
    >
      Review
    </Link>
  );
}

export function GrowerAttentionPanel({ summary }: GrowerAttentionPanelProps) {
  const { counts, items } = summary;
  const requestItems = items.filter((item) => item.type === 'request');
  const otherItems = items.filter((item) => item.type !== 'request');
  const requestBuyers = new Set(requestItems.map((item) => item.detail.split(' submitted ')[0]));
  const groupedRequest = requestItems.length > 1 && requestBuyers.size === 1
    ? {
        ...requestItems[0],
        id: 'grouped-pending-requests',
        title: `${requestItems.length} new buyer requests`,
        detail: Array.from(requestBuyers)[0],
        href: '/grower/orders?view=needs-review',
        badge: 'Review all',
      }
    : null;
  const visibleItems = [
    ...(groupedRequest ? [groupedRequest] : requestItems),
    ...otherItems,
  ].slice(0, 3);

  return (
    <details data-testid="grower-attention-panel" className="pf-panel px-4 py-2 sm:px-5">
      <summary className="min-h-10 cursor-pointer py-2 text-sm font-semibold text-pf-secondary">Messages &amp; updates <span data-testid="grower-attention-total" className="ml-2 rounded-full bg-pf-raised px-2 py-0.5 text-xs text-pf-muted">{counts.totalAttention}</span></summary>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:grid-cols-4 [&>div]:flex [&>div]:items-center [&>div]:justify-between [&>div]:gap-1 sm:[&>div]:block">
        <div className="rounded-lg bg-pf-warning-bg px-2 py-1.5 sm:px-3 sm:py-2">
          <p className="text-xs text-pf-warning">New requests</p>
          <p className="text-lg font-bold text-pf-warning">{counts.pendingRequests}</p>
        </div>
        <div className="rounded-lg bg-pf-info-bg px-2 py-1.5 sm:px-3 sm:py-2">
          <p className="text-xs text-pf-info">Unread messages</p>
          <p className="text-lg font-bold text-pf-info">{counts.unreadBuyerMessages}</p>
        </div>
        <div className="rounded-lg bg-pf-danger-bg px-2 py-1.5 sm:px-3 sm:py-2">
          <p className="text-xs text-pf-danger">Cancellations</p>
          <p className="text-lg font-bold text-pf-danger">{counts.recentCancellations}</p>
        </div>
        <div className="rounded-lg bg-pf-accent-bg px-2 py-1.5 sm:px-3 sm:py-2">
          <p className="text-xs text-pf-accent">Status changes</p>
          <p className="text-lg font-bold text-pf-accent">{counts.recentStatusChanges}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-pf-line bg-pf-canvas px-4 py-6 text-center">
          <h3 className="text-sm font-semibold text-pf-text">Nothing urgent right now</h3>
          <p className="mt-1 text-sm text-pf-muted">Buyer requests and messages will appear here as soon as they need action.</p>
        </div>
      ) : (
        <div className="mt-3 grid gap-2 sm:mt-4 sm:gap-3 lg:grid-cols-2">
          {visibleItems.map((item) => (
            <article key={item.id} className={`rounded-lg border p-3 ${toneClasses[item.tone]}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold sm:text-base">{item.title}</h3>
                    <span className={`hidden rounded-full px-2 py-0.5 text-xs font-semibold ring-1 sm:inline-flex ${badgeClasses[item.tone]}`}>
                      {item.badge}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm opacity-80">{item.detail}</p>
                </div>
              </div>
              <AttentionAction item={item} />
            </article>
          ))}
        </div>
      )}
      {items.length > visibleItems.length || counts.pendingRequests > requestItems.length ? (
        <Link
          href="/grower/orders?view=needs-review"
          className="mt-4 flex min-h-10 items-center justify-center rounded-lg border border-pf-line px-3 text-sm font-semibold text-pf-accent transition-colors hover:bg-pf-accent-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
        >
          Review {counts.pendingRequests} requests →
        </Link>
      ) : null}
    </details>
  );
}
