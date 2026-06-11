import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const formatMoney = (value: number) =>
  `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default async function GrowerCatalogWorkspacePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as { role?: string; growerId?: string };

  if (user.role !== 'GROWER' || !user.growerId) {
    redirect('/dashboard');
  }

  // Stats cover the whole catalog; `products` below is only the recent-items list.
  const catalogWhere = { growerId: user.growerId, isDeleted: false };

  const [products, allProductTotals, totalProducts, availableProducts, lowStockProducts, hiddenPriceProducts] = await Promise.all([
    db.product.findMany({
      where: catalogWhere,
      select: {
        id: true,
        name: true,
        productType: true,
        subType: true,
        price: true,
        inventoryQty: true,
        unit: true,
        isAvailable: true,
        isPriceVisible: true,
        createdAt: true,
        strain: { select: { name: true } },
        strainLegacy: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    db.product.findMany({
      where: catalogWhere,
      select: { price: true, inventoryQty: true },
    }),
    db.product.count({ where: catalogWhere }),
    db.product.count({ where: { ...catalogWhere, isAvailable: true } }),
    db.product.count({ where: { ...catalogWhere, inventoryQty: { lte: 10 } } }),
    db.product.count({ where: { ...catalogWhere, isPriceVisible: false } }),
  ]);

  const inventoryValue = allProductTotals.reduce((total, product) => {
    return total + Number(product.price || 0) * product.inventoryQty;
  }, 0);

  const primaryNextAction = totalProducts === 0
    ? { href: '/grower/products/add', label: 'Add first product', helper: 'Start with basics, then add stock and compliance details.' }
    : lowStockProducts > 0
      ? { href: '/grower/inventory', label: 'Review low stock', helper: `${lowStockProducts} product${lowStockProducts === 1 ? '' : 's'} need inventory attention.` }
      : { href: '/grower/products', label: 'Manage listings', helper: 'Edit products, pricing, availability, and marketplace visibility.' };

  const workspaceSections = [
    {
      title: 'Listings',
      href: '/grower/products',
      description: 'Create, edit, publish, disable, or remove product listings.',
      metric: `${totalProducts} products`,
    },
    {
      title: 'Inventory',
      href: '/grower/inventory',
      description: 'Track stock levels, inventory value, and low-stock products.',
      metric: `${lowStockProducts} low stock`,
    },
    {
      title: 'Marketplace Preview',
      href: '/grower/marketplace',
      description: 'See what buyers see and manage marketplace listing presentation.',
      metric: `${availableProducts} visible`,
    },
    {
      title: 'Pricing Visibility',
      href: '/grower/products',
      description: 'Choose whether buyers see prices or request pricing by message.',
      metric: `${hiddenPriceProducts} by request`,
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6 pb-20 sm:pb-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Catalog Workspace</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage listings, stock, marketplace visibility, and pricing rules from one place.
          </p>
        </div>
        <Link
          href="/grower/products/add"
          className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-green-600 px-4 text-sm font-medium text-white hover:bg-green-700 sm:w-auto"
        >
          Add Product
        </Link>
      </div>

      <div className="rounded-xl border border-green-200 bg-green-50 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-green-800">Next best action</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-green-950">{primaryNextAction.label}</h2>
            <p className="text-sm text-green-800">{primaryNextAction.helper}</p>
          </div>
          <Link
            href={primaryNextAction.href}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-white px-3 text-sm font-medium text-green-700 shadow-sm ring-1 ring-green-200 hover:bg-green-100"
          >
            Open
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Products</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalProducts}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Available</p>
          <p className="mt-1 text-2xl font-bold text-green-700">{availableProducts}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Inventory Value</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{formatMoney(inventoryValue)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Pricing by Request</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">{hiddenPriceProducts}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {workspaceSections.map((section) => (
          <Link
            key={section.title}
            href={section.href}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-green-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-900">{section.title}</h2>
                <p className="mt-1 text-sm text-gray-600">{section.description}</p>
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                {section.metric}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3 sm:px-5">
          <h2 className="text-lg font-semibold text-gray-900">Recent catalog items</h2>
          <p className="mt-1 text-sm text-gray-500">A short view of the products buyers can discover or request pricing for.</p>
        </div>
        {products.length === 0 ? (
          <div className="p-6 text-center">
            <h3 className="text-base font-semibold text-gray-900">No products yet</h3>
            <p className="mt-1 text-sm text-gray-600">Create your first product to start building the grower catalog.</p>
            <Link
              href="/grower/products/add"
              className="mt-4 inline-flex h-9 items-center rounded-lg bg-green-600 px-3 text-sm font-medium text-white hover:bg-green-700"
            >
              Add first product
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {products.map((product) => (
              <div key={product.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">
                    {product.strain?.name || product.strainLegacy || 'No strain linked'} - {product.productType || 'Uncategorized'}
                    {product.subType ? ` - ${product.subType}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">
                    {product.inventoryQty} {product.unit || 'units'}
                  </span>
                  <span className={`rounded-full px-2 py-1 ${product.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {product.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">
                    {product.isPriceVisible ? formatMoney(Number(product.price || 0)) : 'Request pricing'}
                  </span>
                  <Link href={`/grower/products/${product.id}/edit`} className="font-medium text-green-700 hover:text-green-800">
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
