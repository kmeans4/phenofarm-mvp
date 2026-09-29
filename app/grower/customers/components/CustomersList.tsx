'use client';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import MessageBuyerButton from '../../orders/[id]/components/MessageBuyerButton';
export interface CustomerListItem {
  id: string;
  businessName: string;
  licenseNumber: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  orderCount: number;
  isPlatformMember: boolean;
  canEdit: boolean;
  lastOrderDateLabel: string;
  totalDeliveredValueLabel: string;
}
export default function CustomersList({
  customers,
}: {
  customers: CustomerListItem[];
}) {
  return (
    <div className="divide-y divide-pf-line">
      {customers.map((c) => (
        <article key={c.id} className="flex flex-wrap items-center gap-4 p-4">
          <div className="min-w-0 flex-1">
            <Link
              href={`/grower/customers/${c.id}`}
              className="inline-flex min-h-11 items-center text-base font-semibold text-pf-accent"
            >
              {c.businessName}
            </Link>
            <p className="text-sm text-pf-muted">
              {[c.city, c.state].filter(Boolean).join(', ')} · {c.orderCount}{' '}
              orders
            </p>
            <div className="flex flex-wrap gap-x-4">
              {c.phone && (
                <a
                  className="inline-flex min-h-11 items-center text-sm underline"
                  href={`tel:${c.phone}`}
                >
                  {c.phone}
                </a>
              )}
              {c.email && (
                <a
                  className="inline-flex min-h-11 items-center break-all text-sm underline"
                  href={`mailto:${c.email}`}
                >
                  {c.email}
                </a>
              )}
            </div>
            <p className="text-sm text-pf-muted">
              Last order {c.lastOrderDateLabel} · Delivered{' '}
              {c.totalDeliveredValueLabel}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/grower/orders/add?customer=${c.id}`}>
                New order
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/grower/customers/${c.id}/statement`}>
                Statement
              </Link>
            </Button>
            {c.isPlatformMember && (
              <MessageBuyerButton
                buyerName={c.businessName}
                dispensaryId={c.id}
              />
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
