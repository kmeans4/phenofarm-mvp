import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { OperationsSummary } from '../components/OperationsSummary';
import { pluralize } from '@/lib/utils';

const formatMoney = (value: number) =>
  `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default async function GrowerCatalogWorkspacePage() {
  const session = await getAuthSession();

  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as { role?: string; growerId?: string };

  if (user.role !== 'GROWER' || !user.growerId) {
    redirect('/dashboard');
  }

  const catalogWhere = { growerId: user.growerId, isDeleted: false };

  const [
    inventoryTotals,
    totalProducts,
    availableProducts,
    lowStockProducts,
    hiddenPriceProducts,
    missingImageProducts,
    missingTypeProducts,
  ] = await Promise.all([
    db.$queryRaw<Array<{ value: number }>>`SELECT COALESCE(SUM(price * "inventoryQty"), 0)::float AS value FROM products WHERE "growerId" = ${user.growerId} AND "isDeleted" = false`,
    db.product.count({ where: catalogWhere }),
    db.product.count({ where: { ...catalogWhere, isAvailable: true } }),
    db.product.count({ where: { ...catalogWhere, inventoryQty: { gt: 0, lte: 10 } } }),
    db.product.count({ where: { ...catalogWhere, isPriceVisible: false } }),
    db.product.count({ where: { ...catalogWhere, images: { isEmpty: true } } }),
    db.product.count({
      where: {
        ...catalogWhere,
        OR: [
          { productType: null },
          { productType: '' },
        ],
      },
    }),
  ]);

  const inventoryValue = Number(inventoryTotals[0]?.value || 0);

  const primaryNextAction = totalProducts === 0
    ? { href: '/grower/products/add', label: 'Your catalog is empty.', actionLabel: 'Add product', helper: '' }
    : lowStockProducts > 0
      ? { href: '/grower/products?view=low-stock', label: `${pluralize(lowStockProducts, 'listing')} low on stock`, actionLabel: 'Restock', helper: '' }
      : { href: '/grower/products', label: 'Keep your catalog current.', actionLabel: 'Review listings', helper: '' };

  const workspaceSections = [
    {
      title: 'Listings',
      href: '/grower/products',
      description: 'Edit and publish products.',
      metric: `${totalProducts} total`,
    },
    {
      title: 'Inventory',
      href: '/grower/inventory',
      description: 'Update stock quantities.',
      metric: `${pluralize(lowStockProducts, 'stock alert')}`,
    },
    {
      title: 'Buyer preview',
      href: '/grower/marketplace',
      description: 'See your public listings.',
      metric: `${availableProducts} live`,
    },
    {
      title: 'Pricing',
      href: '/grower/products?view=quote-only',
      description: 'Show prices or invite quotes.',
      metric: `${hiddenPriceProducts} quote only`,
    },
  ];

  const healthSummaryItems = [
    {
      title: 'Missing images',
      count: missingImageProducts,
      href: '/grower/products?view=missing-images',
      helper: 'Add photos so verified buyers can inspect listings faster.',
      accent: 'bg-amber-50 text-amber-800 ring-amber-200',
    },
    {
      title: 'Missing type',
      count: missingTypeProducts,
      href: '/grower/products?view=missing-type',
      helper: 'Assign product types so filters and buyer preview stay clean.',
      accent: 'bg-orange-50 text-orange-800 ring-orange-200',
    },
    {
      title: 'Quote only',
      count: hiddenPriceProducts,
      href: '/grower/products?view=quote-only',
      helper: 'Review listings where buyers request pricing by message.',
      accent: 'bg-blue-50 text-blue-800 ring-blue-200',
    },
    {
      title: 'Low stock',
      count: lowStockProducts,
      href: '/grower/products?view=low-stock',
      helper: 'Restock or hide listings with 10 or fewer units on hand.',
      accent: 'bg-red-50 text-red-700 ring-red-200',
    },
  ];

  const advancedSections = [
    {
      title: 'Strains',
      href: '/grower/strains',
      description: 'Maintain strain records used by product listings and batches.',
    },
    {
      title: 'Batches',
      href: '/grower/batches',
      description: 'Manage harvest batches, lot numbers, and lab document links.',
    },
    {
      title: 'Customers',
      href: '/grower/customers',
      description: 'Review dispensary relationships and account details.',
    },
  ];

  return (
    <div className="space-y-3 sm:pb-20 sm:space-y-5">
      <PageHeader mobileInlineActions title="Catalog" actions={<Link href="/grower/products/add" className="inline-flex h-10 items-center justify-center rounded-lg bg-green-600 px-3 text-sm font-semibold text-white hover:bg-green-700 sm:px-4">Add product</Link>} />
      <div className={`${totalProducts > 0 && lowStockProducts === 0 ? 'hidden sm:flex' : 'flex'} flex-wrap items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm`}>
        <p className="font-medium text-green-950">{primaryNextAction.label}</p>
        <Link href={primaryNextAction.href} className="font-semibold text-green-800 underline">{primaryNextAction.actionLabel} →</Link>
      </div>
      <OperationsSummary items={[
        {label: 'Products', value: totalProducts}, {label: 'Available', value: availableProducts},
        {label: 'Stock value', value: formatMoney(inventoryValue)}, {label: 'Quote only', value: hiddenPriceProducts},
      ]} />
      <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
        {workspaceSections.map(section => <Link key={section.title} href={section.href} className="min-h-12 rounded-xl border border-gray-200 bg-white px-3 py-3 shadow-sm hover:border-green-300 sm:p-4">
          <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{section.title}</h2><span className="shrink-0 whitespace-nowrap text-xs font-medium text-green-700">{section.metric}</span></div>
          <p className="mt-1 hidden text-sm text-gray-600 sm:block">{section.description}</p>
        </Link>)}
      </div>
      <section className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
        <h2 className="text-base font-semibold">Catalog health</h2>
        <div className="mt-1 divide-y divide-gray-100 sm:mt-3">
          {healthSummaryItems.filter(item => item.count > 0).map(item => <Link key={item.title} href={item.href} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-green-700"><span>{item.title}</span><span className="font-semibold">{item.count} →</span></Link>)}
        </div>
        {healthSummaryItems.every(item => item.count === 0) && <p className="mt-3 text-sm text-gray-600">{totalProducts ? 'No catalog issues.' : 'Add a product to see catalog health.'}</p>}
        {healthSummaryItems.some(item => item.count === 0) && <details className="text-sm text-gray-500 sm:mt-3"><summary className="min-h-10 cursor-pointer py-2.5">All checks</summary><ul className="mt-2 space-y-2">{healthSummaryItems.map(item => <li key={item.title}>{item.title}: {item.count}</li>)}</ul></details>}
      </section>
      <details className="rounded-xl border border-gray-200 bg-white px-3 py-1 shadow-sm sm:p-4">
        <summary className="min-h-10 cursor-pointer py-2.5 text-sm font-semibold sm:min-h-0 sm:py-0">Strains, batches &amp; customers</summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">{advancedSections.map(section => <Link key={section.title} href={section.href} className="rounded-lg border border-gray-200 p-3 text-sm font-medium text-green-700 hover:bg-green-50">{section.title} →</Link>)}</div>
      </details>
    </div>
  );
}
