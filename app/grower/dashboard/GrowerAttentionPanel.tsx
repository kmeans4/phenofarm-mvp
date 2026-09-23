'use client';

import Link from 'next/link';
import type { GrowerAttentionItem, GrowerAttentionSummary } from '@/lib/grower-attention';

interface GrowerAttentionPanelProps {
  summary: GrowerAttentionSummary;
}

const toneClasses: Record<GrowerAttentionItem['tone'], string> = {
  yellow: 'border-yellow-200 bg-yellow-50 text-yellow-950',
  blue: 'border-blue-200 bg-blue-50 text-blue-950',
  green: 'border-green-200 bg-green-50 text-green-950',
  red: 'border-red-200 bg-red-50 text-red-950',
};

const badgeClasses: Record<GrowerAttentionItem['tone'], string> = {
  yellow: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
  blue: 'bg-blue-100 text-blue-800 ring-blue-200',
  green: 'bg-green-100 text-green-800 ring-green-200',
  red: 'bg-red-100 text-red-800 ring-red-200',
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
        className="mt-2 inline-flex min-h-10 items-center justify-center rounded-lg bg-white px-3 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200 transition hover:bg-blue-100 sm:mt-3"
      >
        Open message
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      className="mt-2 inline-flex min-h-10 items-center justify-center rounded-lg bg-white px-3 text-sm font-semibold text-gray-800 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 sm:mt-3"
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
    <section data-testid="grower-attention-panel" className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Needs attention</h2>
        </div>
        <div
          data-testid="grower-attention-total"
          className="inline-flex items-center justify-center rounded-full bg-gray-900 px-3 py-1 text-sm font-semibold text-white"
        >
          {counts.totalAttention}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:grid-cols-4 [&>div]:flex [&>div]:items-center [&>div]:justify-between [&>div]:gap-1 sm:[&>div]:block">
        <div className="rounded-lg bg-yellow-50 px-2 py-1.5 sm:px-3 sm:py-2">
          <p className="text-xs text-yellow-700">New requests</p>
          <p className="text-lg font-bold text-yellow-950">{counts.pendingRequests}</p>
        </div>
        <div className="rounded-lg bg-blue-50 px-2 py-1.5 sm:px-3 sm:py-2">
          <p className="text-xs text-blue-700">Unread messages</p>
          <p className="text-lg font-bold text-blue-950">{counts.unreadBuyerMessages}</p>
        </div>
        <div className="rounded-lg bg-red-50 px-2 py-1.5 sm:px-3 sm:py-2">
          <p className="text-xs text-red-700">Cancellations</p>
          <p className="text-lg font-bold text-red-950">{counts.recentCancellations}</p>
        </div>
        <div className="rounded-lg bg-green-50 px-2 py-1.5 sm:px-3 sm:py-2">
          <p className="text-xs text-green-700">Status changes</p>
          <p className="text-lg font-bold text-green-950">{counts.recentStatusChanges}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
          <h3 className="text-sm font-semibold text-gray-900">Nothing urgent right now</h3>
          <p className="mt-1 text-sm text-gray-600">Buyer requests and messages will appear here as soon as they need action.</p>
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
          className="mt-4 flex min-h-10 items-center justify-center rounded-lg border border-gray-200 px-3 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
        >
          Review {counts.pendingRequests} requests →
        </Link>
      ) : null}
    </section>
  );
}
