import { signInDestination } from '@/lib/auth-navigation';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { customerSelect, customerWhere } from '@/lib/customers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { Button } from '@/app/components/ui/Button';
import { formatDate, formatMoney } from '@/lib/format';
import { getOrderStatusLabel } from '@/lib/order-workflow';
import { DeleteCustomerButton } from '../components/DeleteCustomerButton';
import MessageBuyerButton from '../../orders/[id]/components/MessageBuyerButton';
export default async function CustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAuthSession();
  if (!session) redirect(await signInDestination());
  if (!session.user.growerId || session.user.role !== 'GROWER')
    redirect('/dashboard');
  const { id } = await params;
  const customer = await db.dispensary.findFirst({
    where: { id, ...customerWhere(session.user.growerId) },
    select: customerSelect,
  });
  if (!customer) notFound();
  const orders = await db.order.findMany({
    where: { growerId: session.user.growerId, dispensaryId: id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      orderId: true,
      status: true,
      totalAmount: true,
      createdAt: true,
    },
  });
  const email = customer.user?.email || customer.offPlatformEmail;
  return (
    <div className="space-y-4">
      <PageHeader
        title={customer.businessName}
        actions={
          <>
            <Button asChild>
              <Link href={`/grower/orders/add?customer=${id}`}>New order</Link>
            </Button>
            {!customer.userId &&
              customer.createdByGrowerId === session.user.growerId && (
                <Button asChild variant="outline">
                  <Link href={`/grower/customers/${id}/edit`}>Edit</Link>
                </Button>
              )}
            <Button asChild variant="outline">
              <Link href={`/grower/customers/${id}/statement`}>Statement</Link>
            </Button>
            {!customer.userId &&
              customer.createdByGrowerId === session.user.growerId &&
              orders.length === 0 && <DeleteCustomerButton id={id} />}
          </>
        }
      />
      <section className="rounded-xl border border-pf-line bg-pf-surface p-4">
        <h2 className="font-semibold">Contact</h2>
        <p className="mt-2 text-sm">{customer.contactName}</p>
        <div className="flex flex-wrap gap-3">
          {customer.phone && (
            <a
              className="inline-flex min-h-11 items-center text-sm text-pf-accent underline"
              href={`tel:${customer.phone}`}
            >
              {customer.phone}
            </a>
          )}
          {email && (
            <a
              className="inline-flex min-h-11 items-center break-all text-sm text-pf-accent underline"
              href={`mailto:${email}`}
            >
              {email}
            </a>
          )}
          {customer.userId && (
            <MessageBuyerButton
              buyerName={customer.businessName}
              dispensaryId={id}
            />
          )}
        </div>
        <p className="text-sm text-pf-muted">
          {[customer.address, customer.city, customer.state, customer.zip]
            .filter(Boolean)
            .join(', ')}
        </p>
        {customer.description && (
          <p className="mt-3 whitespace-pre-wrap text-sm">
            {customer.description}
          </p>
        )}
      </section>
      {[false, true].map((closed) => (
        <section
          key={String(closed)}
          className="rounded-xl border border-pf-line bg-pf-surface p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">
              {closed ? 'Past orders' : 'Open orders'}
            </h2>
            <Link
              className="inline-flex min-h-11 items-center text-sm text-pf-accent"
              href={`/grower/orders${closed ? '/history' : ''}?dispensary=${id}`}
            >
              View all
            </Link>
          </div>
          {orders
            .filter(
              (o) => ['DELIVERED', 'CANCELLED'].includes(o.status) === closed
            )
            .map((o) => (
              <Link
                key={o.id}
                href={`/grower/orders/${o.id}`}
                className="flex flex-wrap justify-between gap-2 border-t border-pf-line py-3 text-sm"
              >
                <span>
                  #{o.orderId}
                  <span className="mt-1 block text-pf-muted">
                    {formatDate(o.createdAt)} · {getOrderStatusLabel(o.status)}
                  </span>
                </span>
                <strong>{formatMoney(Number(o.totalAmount))}</strong>
              </Link>
            ))}
        </section>
      ))}
    </div>
  );
}
