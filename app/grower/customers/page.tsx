import { getAuthSession } from '@/lib/auth-helpers';
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { OperationsSummary } from "../components/OperationsSummary";
import Link from "next/link";
import { format } from 'date-fns';
import { ExtendedUser } from '@/types';
import { customerWhere } from '@/lib/customers';
import CustomersList, { CustomerListItem } from './components/CustomersList';

export default async function GrowerCustomersPage() {
  const session = await getAuthSession();
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as ExtendedUser;

  if (user.role !== 'GROWER' || !user.growerId) {
    redirect('/dashboard');
  }

  const growerId = user.growerId;
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [customers, stats, deliveredStats] = await Promise.all([
    db.dispensary.findMany({
      where: customerWhere(growerId),
      select: { id: true, businessName: true, licenseNumber: true, phone: true, city: true, state: true, userId: true, createdByGrowerId: true, offPlatformEmail: true, contactName: true, user: { select: { email: true, name: true } } },
      orderBy: { businessName: 'asc' },
    }),
    db.order.groupBy({ by: ['dispensaryId'], where: { growerId }, _count: { _all: true }, _max: { createdAt: true } }),
    db.order.groupBy({ by: ['dispensaryId'], where: { growerId, status: 'DELIVERED' }, _sum: { totalAmount: true } }),
  ]);
  const statsByCustomer = new Map(stats.map((group) => [group.dispensaryId, group]));
  const deliveredByCustomer = new Map(deliveredStats.map((group) => [group.dispensaryId, Number(group._sum.totalAmount || 0)]));
  const customerCount = customers.length;
  const totalCustomerOrders = stats.reduce((sum, group) => sum + group._count._all, 0);
  const orderedInLast90Days = stats.filter((group) => group._max.createdAt && group._max.createdAt >= ninetyDaysAgo).length;
  const customerRows: CustomerListItem[] = customers.map((customer) => {
    const summary = statsByCustomer.get(customer.id);
    return {
      id: customer.id, businessName: customer.businessName, licenseNumber: customer.licenseNumber,
      contactName: customer.user?.name || customer.contactName || null,
      email: customer.user?.email || customer.offPlatformEmail || null,
      phone: customer.phone, city: customer.city, state: customer.state,
      orderCount: summary?._count._all || 0, isPlatformMember: Boolean(customer.userId), canEdit: !customer.userId && customer.createdByGrowerId === growerId,
      lastOrderDateLabel: summary?._max.createdAt ? format(summary._max.createdAt, 'MMM d, yyyy') : '—',
      totalDeliveredValueLabel: `$${(deliveredByCustomer.get(customer.id) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    };
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Customers"
        mobileInlineActions
        actions={<Link href="/grower/customers/add" className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700" aria-label="Add customer"><span className="sm:hidden">Add</span><span className="hidden sm:inline">Add customer</span></Link>}
      />

      <OperationsSummary items={[{label: 'Customers', value: customerCount}, {label: 'Active · 90 days', value: orderedInLast90Days}, {label: 'Requests', value: totalCustomerOrders}]} />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {customers.length === 0 ? (
          <div className="text-center py-8 sm:py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 mx-4 sm:mx-6 mb-4 sm:mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers yet</h3>
            <p className="text-gray-500 mb-2 max-w-sm mx-auto">
              Add a contact or receive a buyer request to get started.
            </p>
          </div>
        ) : (
          <CustomersList customers={customerRows} />
        )}
      </div>
    </div>
  );
}
