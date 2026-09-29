'use client';
import Link from 'next/link';
import { Badge } from '@/app/components/ui/Badge';
import { getOrderStatusLabel } from '@/lib/order-workflow';
import { formatMoney, formatDate } from '@/lib/format';
import { BuyAgainButton } from './BuyAgainButton';
interface Order {
  id: string;
  orderId: string;
  status: string;
  createdAt: string | Date;
  totalAmount: number;
  hasUnreadMessages?: boolean;
  createdBy?: string;
  buyerAcknowledgedAt?: string | Date | null;
  grower: { businessName: string } | null;
  items?: {
    productId: string;
    quantity: number;
    product: { name: string; unit: string | null } | null;
  }[];
}
export function OrdersTable({
  orders,
  maxRows,
  compact = false,
}: {
  orders: Order[];
  maxRows?: number;
  compact?: boolean;
  showFilters?: boolean;
  showWorkflowViews?: boolean;
  showResultCount?: boolean;
}) {
  const visible = maxRows ? orders.slice(0, maxRows) : orders;
  return visible.length ? (
    <div className="divide-y divide-pf-line">
      {visible.map((order) => (
        <article
          key={order.id}
          className="flex flex-wrap items-center gap-2 py-3 sm:gap-4"
        >
          <Link
            href={`/dispensary/orders/${order.id}`}
            className="min-w-0 flex-1 rounded-lg p-1 hover:bg-pf-raised focus-visible:ring-2 focus-visible:ring-pf-accent"
          >
            <div className="flex flex-wrap items-center gap-2">
              <strong className="break-all text-sm">{order.orderId}</strong>
              <Badge
                variant={
                  order.status === 'DELIVERED'
                    ? 'success'
                    : order.status === 'CANCELLED'
                      ? 'error'
                      : 'info'
                }
              >
                {getOrderStatusLabel(order.status)}
              </Badge>
              {order.hasUnreadMessages && (
                <span className="inline-flex items-center gap-1 text-sm text-pf-accent">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  New message
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-pf-secondary">
              {order.grower?.businessName || 'Grower'} ·{' '}
              {formatDate(order.createdAt)}
            </p>
            {order.items?.length ? (
              <p className="mt-1 text-sm text-pf-muted">
                {order.items[0].product?.name || 'Product'} ×{' '}
                {order.items[0].quantity}{' '}
                {order.items[0].product?.unit?.toLowerCase() || 'units'}
                {order.items.length > 1
                  ? ` + ${order.items.length - 1} more`
                  : ''}
              </p>
            ) : null}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-sm">
              {formatMoney(order.totalAmount)}
            </strong>
            {!compact && order.items?.length ? (
              <BuyAgainButton
                items={order.items.map((item) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                }))}
              />
            ) : null}
          </div>
        </article>
      ))}
    </div>
  ) : (
    <p className="py-6 text-center text-sm text-pf-muted">No orders yet.</p>
  );
}
