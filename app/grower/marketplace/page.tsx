import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function GrowerMarketplacePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user;
  
  if (!user?.growerId) {
    redirect('/dashboard');
  }

  // Fetch products with strain info
  const rawProducts = await db.product.findMany({
    where: { growerId: user.growerId },
    include: {
      strain: { select: { id: true, name: true } }
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

  const categories = ['Flower', 'Edibles', 'Cartridge', 'Bulk Extract', 'Drink', 'Merchandise', 'Prepack', 'Tincture', 'Topicals', 'Plant Material', 'Live Plant', 'Seed'];

  return (
    <div className="space-y-5 sm:space-y-6 p-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Grower Marketplace</h1>
        <Link href="/grower/products/add" className="w-full sm:w-auto text-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          + List New Product
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button key={category} className="px-4 py-2 rounded-full border border-green-600 text-green-600 hover:bg-green-50 whitespace-nowrap">
            {category}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Your Active Listings</h2>
            <span className="text-sm text-gray-500">{products.length} products</span>
          </div>
        </div>
        
        <div className="p-6">
          {products.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7h18M5 7l1 12h12l1-12M9 7V5a3 3 0 016 0v2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No active listings yet</h3>
              <p className="text-gray-500 mb-2 max-w-md mx-auto">
                Your marketplace is empty. List a product so dispensaries can discover and order from you.
              </p>
              <p className="text-sm text-gray-500 mb-6">Next step: choose a product and publish its listing details.</p>
              <Link href="/grower/products/add" className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                List your first product
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">🌿</span>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <span className="text-sm text-gray-500">
                        {product.productType || 'Uncategorized'}
                        {product.subType && ` - ${product.subType}`}
                      </span>
                    </div>
                    {product.strainName && <p className="text-sm text-gray-600 mb-3">Strain: {product.strainName}</p>}
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
                      <span className="text-sm text-gray-500">/{product.unit || 'unit'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                      <span>{product.inventoryQty} available</span>
                      {product.thc && <span>THC: {product.thc}%</span>}
                    </div>
                    <Link href={`/grower/products/${product.id}`} className="block w-full text-center bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                      Manage Listing
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
