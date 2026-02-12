import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function GrowerMarketplacePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const products: any[] = [];
  const categories = ['Flower', 'Concentrates', 'Edibles', 'Topicals', 'Vapes', 'Raw Materials'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Grower Marketplace</h1>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          + List New Product
        </button>
      </div>

      {/* Categories Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button 
            key={category}
            className="px-4 py-2 rounded-full border border-green-600 text-green-600 hover:bg-green-50 whitespace-nowrap"
          >
            {category}
          </button>
        ))}
      </div>

      {/* Live Inventory Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Your Active Listings</h2>
            <span className="text-sm text-gray-500">{products.length} products</span>
          </div>
        </div>
        
        <div className="p-6">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No products listed yet</p>
              <Link 
                href="/grower/products/add"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                + Add your first product to the marketplace
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">[Product Image]</span>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <span className="text-sm text-gray-500">{product.category}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{product.strain}</p>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-bold text-gray-900">
                        ${product.pricePerUnit.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {product.unitSize} {product.unitType}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                      <span>{product.quantityAvailable} / {product.quantityTotal} available</span>
                      <span>THC: {product.thcPercentage}%</span>
                    </div>
                    <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                      Manage Listing
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Orders Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Active Marketplace Orders</h2>
        </div>
        
        <div className="px-6 py-4">
          {products.length > 0 ? (
            <div className="space-y-4">
              {products.slice(0, 3).map((product) => (
                <div key={product.id} className="flex justify-between items-center py-3 border-b border-gray-100">
                  <div>
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.strain}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">${product.pricePerUnit.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">{product.quantityAvailable} left</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">List products to appear in the marketplace.</p>
          )}
        </div>
      </div>
    </div>
  );
}
