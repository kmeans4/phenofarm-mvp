import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

const formatInventoryUnit = (unit: string | null | undefined, qty: number): string => {
  const trimmed = (unit || '').trim();
  if (!trimmed) return 'units';
  if (qty === 1) return trimmed;

  const lower = trimmed.toLowerCase();
  if (lower === 'oz' || lower === 'ml') return trimmed;
  if (lower.endsWith('s')) return trimmed;

  return `${trimmed}s`;
};

function InventoryStatusBadge({ isAvailable, quantity }: { isAvailable?: boolean; quantity?: number }) {
  if (!isAvailable) {
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Unavailable</span>;
  }
  if ((quantity || 0) <= 0) {
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Out of Stock</span>;
  }
  return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Available</span>;
}

export default async function GrowerInventoryPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const sessionUser = session.user as { growerId?: string };
  
  // Fetch products for this grower with strain info
  const rawProducts = await db.product.findMany({
    where: { growerId: sessionUser.growerId, isDeleted: false },
    select: {
      id: true,
      name: true,
      productType: true,
      subType: true,
      categoryLegacy: true,
      price: true,
      inventoryQty: true,
      unit: true,
      isAvailable: true,
      thcLegacy: true,
      cbdLegacy: true,
      strainLegacy: true,
      strain: { select: { id: true, name: true } },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Convert Decimal prices to numbers and use new schema fields
  const products = rawProducts.map((p) => ({
    ...p,
    price: Number(p.price) || 0,
    thc: p.thcLegacy ? Number(p.thcLegacy) : null,
    cbd: p.cbdLegacy ? Number(p.cbdLegacy) : null,
    // Use strain relation or fallback to legacy
    strainName: p.strain?.name || p.strainLegacy,
  }));

  const totalValue = products?.reduce((sum: number, p: { price: number; inventoryQty: number }) => sum + ((p?.price || 0) * (p?.inventoryQty || 0)), 0) || 0;
  const lowStockCount = products?.filter((p: { inventoryQty: number }) => (p?.inventoryQty || 0) <= 10)?.length || 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage product stock, pricing, and availability</p>
        </div>
        <Link href="/grower/products/add" className="w-full sm:w-auto text-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          + Add Product
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-xs sm:text-sm text-gray-600">Total Products</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{products?.length || 0}</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-xs sm:text-sm text-gray-600">Total Value</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">${totalValue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-xs sm:text-sm text-gray-600">Low Stock</p>
          <p className={`text-xl sm:text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{lowStockCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Product Inventory</h2>
        </div>
        {!products || products.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 mx-6 mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No inventory yet</h3>
            <p className="text-gray-500 mb-2 max-w-md mx-auto">
              Add your first product to start tracking stock, pricing, and availability in one place.
            </p>
            <p className="text-sm text-gray-500 mb-6">Next step: create a product in your catalog.</p>
            <Link href="/grower/products/add" className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add your first product
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-2.5 p-3 sm:hidden">
              {products.map((product) => (
                <div key={product?.id} className="rounded-xl border border-gray-200 p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900">{product?.name || 'Unnamed'}</div>
                      {product?.strainName && <div className="text-xs text-gray-500 mt-1 truncate">{product.strainName}</div>}
                    </div>
                    <InventoryStatusBadge isAvailable={product?.isAvailable} quantity={product?.inventoryQty} />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs sm:text-sm">
                    <div>
                      <p className="text-gray-500">Type</p>
                      <p className="text-gray-900">{product?.productType ? `${product.productType}${product.subType ? ` - ${product.subType}` : ''}` : (product?.categoryLegacy || '-')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Price</p>
                      <p className="text-gray-900">${product?.price?.toFixed(2) || '0.00'}/{product?.unit || 'unit'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Inventory</p>
                      <p className={(product?.inventoryQty || 0) <= 10 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                        {product?.inventoryQty || 0} {formatInventoryUnit(product?.unit, product?.inventoryQty || 0)}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/grower/products/${product.id}/edit`}
                    className="mt-3 inline-flex text-sm font-medium text-green-700 hover:text-green-800"
                  >
                    Edit product
                  </Link>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-[11px] sm:text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-[11px] sm:text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-[11px] sm:text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-[11px] sm:text-xs font-medium text-gray-500 uppercase">Inventory</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-[11px] sm:text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-[11px] sm:text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product?.id}>
                      <td className="px-3 sm:px-6 py-2.5 sm:py-4">
                        <div className="font-medium text-sm sm:text-base text-gray-900">{product?.name || 'Unnamed'}</div>
                        {product?.strainName && <div className="text-[11px] sm:text-xs text-gray-500">{product.strainName}</div>}
                      </td>
                      <td className="px-3 sm:px-6 py-2.5 sm:py-4 text-xs sm:text-sm text-gray-600">
                        {product?.productType ? `${product.productType}${product.subType ? ` - ${product.subType}` : ''}` : (product?.categoryLegacy || '-')}
                      </td>
                      <td className="px-3 sm:px-6 py-2.5 sm:py-4 text-xs sm:text-sm text-gray-600">${product?.price?.toFixed(2) || '0.00'}/{product?.unit || 'unit'}</td>
                      <td className="px-3 sm:px-6 py-2.5 sm:py-4 text-xs sm:text-sm">
                        <span className={(product?.inventoryQty || 0) <= 10 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                          {product?.inventoryQty || 0} {formatInventoryUnit(product?.unit, product?.inventoryQty || 0)}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-2.5 sm:py-4">
                        <InventoryStatusBadge isAvailable={product?.isAvailable} quantity={product?.inventoryQty} />
                      </td>
                      <td className="px-3 sm:px-6 py-2.5 sm:py-4 text-right">
                        <Link
                          href={`/grower/products/${product.id}/edit`}
                          className="text-xs sm:text-sm font-medium text-green-700 hover:text-green-800"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
