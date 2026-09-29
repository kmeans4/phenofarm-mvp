import { EmptyState } from '@/app/components/ui/EmptyState';
import { Pagination } from '@/app/components/ui/Pagination';
import { signInDestination } from '@/lib/auth-navigation';
import { getAuthSession } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { OrderFilters } from '../components/OrderFilters';
import { parsePage } from '@/lib/buyer-products';
import { Prisma, OrderStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { unreadMessageCounts } from '@/lib/message-counts';
import Link from 'next/link';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { OrdersTable } from '../components/OrdersTable';

export default async function DispensaryOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    sort?: string;
  }>;
}) {
  const session = await getAuthSession();

  if (!session) {
    redirect(await signInDestination());
  }

  const user = session.user as {
    id: string;
    role: string;
    growerId?: string;
    dispensaryId?: string;
  };

  if (user.role !== 'DISPENSARY' || !user.dispensaryId) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const page = parsePage(params.page ?? null);
  const pageSize = 25;
  const status =
    params.status &&
    Object.values(OrderStatus).includes(params.status as OrderStatus)
      ? (params.status as OrderStatus)
      : undefined;
  const sort = ['oldest', 'total-desc', 'total-asc', 'status'].includes(
    params.sort || ''
  )
    ? params.sort!
    : 'newest';
  const orderBy: Prisma.OrderOrderByWithRelationInput[] =
    sort === 'oldest'
      ? [{ createdAt: 'asc' }, { id: 'asc' }]
      : sort.startsWith('total')
        ? [
            { totalAmount: sort.endsWith('asc') ? 'asc' : 'desc' },
            { id: 'desc' },
          ]
        : sort === 'status'
          ? [{ status: 'asc' }, { createdAt: 'desc' }]
          : [{ createdAt: 'desc' }, { id: 'desc' }];
  const search = params.search?.trim().slice(0, 160) || '';
  const where: Prisma.OrderWhereInput = {
    dispensaryId: user.dispensaryId,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { orderId: { contains: search, mode: 'insensitive' } },
            {
              grower: {
                businessName: { contains: search, mode: 'insensitive' },
              },
            },
          ],
        }
      : {}),
  };
  const [orders, filteredCount] = await Promise.all([
    db.order.findMany({
      where,
      select: {
        id: true,
        orderId: true,
        growerId: true,
        createdAt: true,
        status: true,
        totalAmount: true,
        createdBy: true,
        buyerAcknowledgedAt: true,
        grower: { select: { businessName: true } },
        items: {
          select: {
            productId: true,
            quantity: true,
            product: { select: { name: true, unit: true } },
          },
        },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.order.count({ where }),
  ]);

  const growerIds = Array.from(
    new Set(orders.map((order) => order.growerId).filter(Boolean))
  );
  const conversations =
    growerIds.length > 0
      ? await db.conversation.findMany({
          where: {
            dispensaryId: user.dispensaryId,
            growerId: { in: growerIds },
          },
          select: {
            id: true,
            growerId: true,
            dispensaryLastReadAt: true,
          },
        })
      : [];
  const unreadByConversation = await unreadMessageCounts(
    user.id,
    conversations.map((conversation) => ({
      id: conversation.id,
      lastReadAt: conversation.dispensaryLastReadAt,
    }))
  );
  const unreadGrowerIds = new Set(
    conversations
      .filter(
        (conversation) => (unreadByConversation.get(conversation.id) || 0) > 0
      )
      .map((conversation) => conversation.growerId)
  );

  const serializedOrders = orders.map((order) => ({
    id: order.id,
    orderId: order.orderId,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    totalAmount: Number(order.totalAmount),
    grower: order.grower,
    createdBy: order.createdBy,
    buyerAcknowledgedAt: order.buyerAcknowledgedAt?.toISOString() ?? null,
    hasUnreadMessages: unreadGrowerIds.has(order.growerId),
    items: order.items,
  }));
  return (
    <div className="space-y-4">
      <PageHeader
        title="Orders"
        mobileInlineActions
        actions={
          <Button variant="primary" asChild className="w-auto">
            <Link href="/dispensary/catalog">Catalog</Link>
          </Button>
        }
      />

      {/* Orders List */}
      <Card className="bg-pf-surface shadow-sm border border-pf-line">
        <CardContent className="p-3 sm:p-4">
          <OrderFilters search={search} status={status || ''} sort={sort} />
          {orders.length === 0 ? (
            <EmptyState
              title="No orders found"
              description={
                search || status
                  ? 'Try fewer filters.'
                  : 'Find products in the catalog to start an order.'
              }
              action={{
                label: search || status ? 'Clear filters' : 'Browse catalog',
                href:
                  search || status
                    ? '/dispensary/orders'
                    : '/dispensary/catalog',
              }}
              className="rounded-xl border border-dashed border-pf-line-strong bg-pf-canvas"
            />
          ) : (
            <OrdersTable
              orders={serializedOrders}
              showFilters={false}
              showWorkflowViews={false}
              showResultCount={false}
            />
          )}
          {filteredCount > 0 && filteredCount <= pageSize && (
            <p className="mt-4 text-center text-sm text-pf-muted">
              {filteredCount} {filteredCount === 1 ? 'order' : 'orders'}
            </p>
          )}
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filteredCount}
            basePath="/dispensary/orders"
            query={{
              sort,
              ...(search ? { search } : {}),
              ...(status ? { status } : {}),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
