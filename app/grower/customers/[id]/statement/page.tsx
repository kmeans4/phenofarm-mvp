import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { customerWhere } from '@/lib/customers';
import { formatProductMoney } from '@/lib/product-display';
import { StatementCsvExport } from './StatementCsvExport';

export default async function CustomerStatementPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string; to?: string }> }) {
  const session = await getAuthSession(); const user = session?.user as { role?: string; growerId?: string } | undefined;
  if (!session) redirect('/auth/sign_in'); if (user?.role !== 'GROWER' || !user.growerId) redirect('/dashboard');
  const { id } = await params; const filters = await searchParams;
  const from = filters.from ? new Date(`${filters.from}T00:00:00`) : undefined; const to = filters.to ? new Date(`${filters.to}T23:59:59.999`) : undefined;
  const customer = await db.dispensary.findFirst({ where: { id, ...customerWhere(user.growerId) }, select: { businessName: true } }); if (!customer) redirect('/grower/customers');
  const orders = await db.order.findMany({ where: { growerId: user.growerId, dispensaryId: id, status: 'DELIVERED', ...(from || to ? { deliveredAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}) }, orderBy: { deliveredAt: 'desc' }, include: { items: { include: { product: { select: { name: true, unit: true } }, acceptedQuote: { select: { id: true } } } } } });
  const total = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const rows = [['Request ID','Delivered date','Product','Quantity','Unit','Unit price','Line total','Pricing source','Settlement'], ...orders.flatMap((order) => order.items.map((item) => [order.orderId, order.deliveredAt ? format(order.deliveredAt, 'yyyy-MM-dd') : '', item.product?.name || 'Unknown product', String(item.quantity), item.product?.unit || 'unit', Number(item.unitPrice).toFixed(2), Number(item.totalPrice).toFixed(2), item.acceptedQuoteId ? 'Accepted quote' : 'List price', 'Settled directly between businesses — no funds processed by PhenoFarm']))];
  return (
    <div className="space-y-4 pb-8 sm:space-y-5">
      <Link href={`/grower/customers/${id}/edit`} className="text-sm font-semibold text-pf-accent">← Customer</Link>
      <PageHeader mobileInlineActions title="Statement" description={customer.businessName} actions={<StatementCsvExport name={customer.businessName} rows={rows} />} />
      <form className="grid grid-cols-2 items-end gap-3 rounded-xl border border-pf-line bg-pf-surface p-4 sm:flex sm:flex-wrap">
        <label className="min-w-0 text-sm font-medium">From<input type="date" name="from" defaultValue={filters.from} className="mt-1 block h-10 min-w-0 w-full text-base sm:text-sm rounded-lg border border-pf-line-strong px-2" /></label>
        <label className="min-w-0 text-sm font-medium">To<input type="date" name="to" defaultValue={filters.to} className="mt-1 block h-10 min-w-0 w-full text-base sm:text-sm rounded-lg border border-pf-line-strong px-2" /></label>
        <button className="h-10 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-[#032116]">Apply</button>
      </form>
      <section className="overflow-hidden rounded-xl border border-pf-line bg-pf-surface">
        <div className="flex flex-wrap justify-between gap-3 border-b border-pf-line p-4 text-sm"><span className="font-semibold">{orders.length} delivered request{orders.length === 1 ? '' : 's'}</span><span className="font-bold text-pf-accent">{formatProductMoney(total)}</span></div>
        {orders.length ? <>
          <div className="divide-y divide-pf-line sm:hidden">{orders.map(order => <article key={order.id} className="p-3 text-sm">
            <Link href={`/grower/orders/${order.id}`} className="break-all font-semibold text-pf-accent">#{order.orderId}</Link>
            <p className="mt-1 text-xs text-pf-muted">{order.deliveredAt ? format(order.deliveredAt, 'MMM d, yyyy') : 'Date not recorded'}</p>
            <div className="mt-3 flex items-start justify-between gap-3"><p className="min-w-0 text-pf-muted">{order.items.map(item => `${item.product?.name || 'Product'} × ${item.quantity}`).join(', ')}</p><strong className="shrink-0">{formatProductMoney(Number(order.totalAmount))}</strong></div>
          </article>)}</div>
          <div className="hidden overflow-x-auto sm:block"><table className="w-full min-w-[720px] text-sm"><thead className="bg-pf-canvas"><tr><th className="p-3 text-left">Request</th><th className="p-3 text-left">Delivered</th><th className="p-3 text-left">Items</th><th className="p-3 text-right">Value</th></tr></thead><tbody>{orders.map(order => <tr key={order.id} className="border-t border-pf-line"><td className="p-3"><Link href={`/grower/orders/${order.id}`} className="font-semibold text-pf-accent">#{order.orderId}</Link></td><td className="p-3">{order.deliveredAt ? format(order.deliveredAt, 'MMM d, yyyy') : 'Not recorded'}</td><td className="p-3">{order.items.map(item => `${item.product?.name || 'Product'} × ${item.quantity}`).join(', ')}</td><td className="p-3 text-right font-semibold">{formatProductMoney(Number(order.totalAmount))}</td></tr>)}</tbody></table></div>
        </> : <p className="p-8 text-center text-sm text-pf-muted">No delivered requests in this date range.</p>}
      </section>
      <p className="text-xs text-pf-muted">Payments stay between businesses; PhenoFarm does not collect funds.</p>
    </div>
  );
}
