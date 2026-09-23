import { getAuthSession } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { OperationsSummary } from '../components/OperationsSummary';
import { formatProductMoney } from '@/lib/product-display';
import { Pagination } from '@/app/components/ui/Pagination';
import OrdersList from './components/OrdersList';
import { ExtendedUser } from '@/types';

export default async function GrowerOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ dispensary?: string; page?: string }>;
}) {
  const session = await getAuthSession();
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as ExtendedUser;
  
  if (user.role !== 'GROWER' || !user.growerId) {
    redirect('/dashboard');
  }

  const params = searchParams ? await searchParams : {};
  const dispensaryFilterId = typeof params.dispensary === 'string' && params.dispensary.trim()
    ? params.dispensary.trim()
    : null;
  const customerFilter = dispensaryFilterId
    ? await db.dispensary.findFirst({
        where: {
          id: dispensaryFilterId,
          orders: {
            some: {
              growerId: user.growerId,
            },
          },
        },
        select: {
          id: true,
          businessName: true,
        },
      })
    : null;
  const orderScope = {
    growerId: user.growerId,
    ...(customerFilter ? { dispensaryId: customerFilter.id } : {}),
  };

  const pageSize = 50;
  const groups = await db.order.groupBy({ by: ['status'], where: orderScope, _count: { _all: true }, _sum: { totalAmount: true } });
  const activeStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'];
  const totalOrders = groups.reduce((sum, group) => sum + group._count._all, 0);
  const activeCount = groups.filter((group) => activeStatuses.includes(group.status)).reduce((sum, group) => sum + group._count._all, 0);
  const pendingCount = groups.find((group) => group.status === 'PENDING')?._count._all || 0;
  const trackedWholesaleValue = groups.filter((group) => group.status !== 'CANCELLED').reduce((sum, group) => sum + Number(group._sum.totalAmount || 0), 0);
  const page = Math.min(Math.max(1, Number.parseInt(params.page || '1', 10) || 1), Math.max(1, Math.ceil(activeCount / pageSize)));
  const activeOrders = await db.order.findMany({
    where: { ...orderScope, status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] } },
    select: { id: true, orderId: true, status: true, createdAt: true, updatedAt: true, totalAmount: true, subtotal: true, tax: true, shippingFee: true, dispensary: { select: { businessName: true } } },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * pageSize, take: pageSize,
  });

  // Serialize orders for client component
  const serializedOrders = activeOrders.map(order => ({
    id: order.id,
    orderId: order.orderId,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    totalAmount: Number(order.totalAmount),
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    shippingFee: Number(order.shippingFee),
    updatedAt: order.updatedAt.toISOString(),
    dispensary: order.dispensary,
  }));

  return (
    <div className="space-y-3 sm:space-y-6 pb-20 sm:pb-24">
      <PageHeader
        mobileInlineActions={!customerFilter}
        title="Requests"
        description={
          customerFilter
            ? `Review active requests for ${customerFilter.businessName}`
            : undefined
        }
        actions={
          <>
          {customerFilter && (
            <Button variant="outline" asChild className="shrink-0">
              <Link href="/grower/orders">Clear filter</Link>
            </Button>
          )}
          <Button variant="outline" asChild className="shrink-0">
            <Link href="/grower/orders/history">History</Link>
          </Button>
          <Button variant="primary" asChild className="shrink-0">
            <Link href="/grower/orders/add" aria-label="Record request"><span className="sm:hidden">Record</span><span className="hidden sm:inline">Record request</span></Link>
          </Button>
          </>
        }
      />

      <OperationsSummary items={[{label: 'Requests', value: totalOrders}, {label: 'Active', value: activeCount}, {label: 'Needs review', value: pendingCount}, {label: 'Est. value', value: formatProductMoney(trackedWholesaleValue)}]} />
      <p className="text-xs text-pf-muted">Excludes cancelled requests. Payment is arranged directly.</p>

      {/* Orders List with Batch Actions */}
      <OrdersList initialOrders={serializedOrders} customerFilterLabel={customerFilter?.businessName} />
      <Pagination page={page} pageSize={pageSize} total={activeCount} basePath="/grower/orders" query={customerFilter ? { dispensary: customerFilter.id } : {}} />
    </div>
  );
}
