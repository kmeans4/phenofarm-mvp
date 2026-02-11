import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function DispensaryCatalogPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const categories = ['All', 'Flower', 'Concentrates', 'Edibles', 'Topicals', 'Vapes', 'Raw Materials'];
  const growerGroups = [
    {
      grower: 'Green Valley Nurseries',
      products: [
        { id: 1, name: 'Blue Dream Flower', strain: 'Indica', price: 45, thc: 22, stock: 120 },
        { id: 2, name: 'Green Crack', strain: 'Sativa', price: 42, thc: 20, stock: 85 },
        { id: 3, name: 'Granddaddy Purple', strain: 'Indica', price: 48, thc: 23, stock: 60 },
      ]
    },
    {
      grower: 'Vermont Green Works',
      products: [
        { id: 4, name: 'Sativa Concentrate', strain: 'Sativa', price: 85, thc: 75, stock: 45 },
        { id: 5, name: 'CBD Oil', strain: 'Indica', price: 65, thc: 0.3, stock: 30 },
      ]
    },
    {
      grower: 'Green Mountain Growers',
      products: [
        { id: 6, name: 'EDM Edibles', strain: 'Hybrid', price: 35, thc: 15, stock: 100 },
        { id: 7, name: 'Topical Cream', strain: 'Indica', price: 40, thc: 12, stock: 25 },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Grower Catalogs</h1>
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Search products..." 
            className="rounded-lg border border-gray-300 px-4 py-2"
          />
          <button className="px-4 py-2 border border-gray-300 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button 
            key={category}
            className="px-4 py-2 rounded-full border border-gray-300 hover:border-green-500 hover:bg-green-50 whitespace-nowrap transition-colors"
          >
            {category}
          </button>
        ))}
      </div>

      {/* Grower Groups */}
      {growerGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">{group.grower}</h2>
              <p className="text-sm text-gray-500">{group.products.length} products available</p>
            </div>
            <button className="text-green-600 hover:text-green-700 text-sm font-medium">
              View All
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.products.map((product) => (
                <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">[Product Image]</span>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {product.strain}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-bold text-gray-900">${product.price}</span>
                      <span className="text-sm text-gray-500">
                        {product.stock} available
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-3 text-sm text-gray-600">
                      <span>THC: {product.thc}%</span>
                    </div>
                    <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Saved Brands */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Your Saved Brands</h2>
        </div>
        
        <div className="px-6 py-4">
          <div className="flex gap-4 overflow-x-auto">
            {['Green Valley Nurseries', 'Vermont Green Works', 'Green Mountain Growers'].map((brand) => (
              <button 
                key={brand}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 whitespace-nowrap"
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
