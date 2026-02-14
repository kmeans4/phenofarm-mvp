import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function GrowerInventoryPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const sessionUser = (session as any).user as { growerId?: string };
  
  // Fetch products for this grower
  const rawProducts = await db.product.findMany({
    where: { growerId: sessionUser.growerId },
    orderBy: { createdAt: 'desc' },
  });

  // Convert Decimal prices to numbers
  const products = rawProducts.map((p) => ({
    ...p,
    price: Number(p.price) || 0,
    thc: p.thc ? Number(p.thc) : null,
    cbd: p.cbd ? Number(p.cbd) : null,
  }));

  const totalValue = products?.reduce((sum: number, p: { price: number; inventoryQty: number }) => sum + ((p?.price || 0) * (p?.inventoryQty || 0)), 0) || 0;
  const lowStockCount = products?.filter((p: { price: number; inventoryQty: number }) => (p?.inventoryQty || 0) <= 10)?.length || 0;

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your product catalog</p>
        </div>
        <Link href="/grower/products/add" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          + Add Product
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Products</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{products?.length || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${totalValue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Low Stock</p>
          <p className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{lowStockCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Product Inventory</h2>
        </div>
        {!products || products.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No products yet.</p>
            <Link href="/grower/products/add" className="text-green-600 hover:underline mt-2 inline-block">Add your first product</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inventory</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product?.id}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{product?.name || 'Unnamed'}</div>
                      {product?.strain && <div className="text-xs text-gray-500">{product.strain}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product?.category || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">${product?.price?.toFixed(2) || '0.00'}/{product?.unit || 'unit'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={(product?.inventoryQty || 0) <= 10 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                        {product?.inventoryQty || 0} {product?.unit || 'unit'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {product?.isAvailable ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Available</span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Unavailable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
