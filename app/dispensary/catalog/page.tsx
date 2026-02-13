import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";

interface ProductWithGrower {
  id: string;
  name: string;
  strain: string | null;
  category: string | null;
  thc: number | null;
  price: number;
  inventoryQty: number;
  unit: string;
  isAvailable: boolean;
  grower: {
    id: string;
    businessName: string;
  };
}

export default async function DispensaryCatalogPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as any;
  
  if (user.role !== 'DISPENSARY') {
    redirect('/dashboard');
  }

  // Fetch all available products with grower info
  const products = await db.product.findMany({
    where: {
      isAvailable: true,
      inventoryQty: { gt: 0 },
    },
    include: {
      grower: {
        select: {
          id: true,
          businessName: true,
        },
      },
    },
    orderBy: [
      { grower: { businessName: 'asc' } },
      { name: 'asc' },
    ],
  });

  // Group products by grower
  const growerGroups = products.reduce((groups: any[], product) => {
    const existingGroup = groups.find(g => g.growerId === product.grower.id);
    
    if (existingGroup) {
      existingGroup.products.push(product);
    } else {
      groups.push({
        growerId: product.grower.id,
        growerName: product.grower.businessName,
        products: [product],
      });
    }
    
    return groups;
  }, []);

  const categories = ['All', 'Flower', 'Concentrates', 'Edibles', 'Topicals', 'Vapes', 'Pre-rolls', 'Other'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Grower Catalogs</h1>
          <p className="text-gray-600 mt-1">Browse products from verified growers</p>
        </div>
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Search products..." 
            className="rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <Link
            href="/dispensary/cart"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Cart
          </Link>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button 
            key={category}
            className="px-4 py-2 rounded-full border border-gray-300 hover:border-green-500 hover:bg-green-50 whitespace-nowrap transition-colors text-sm"
          >
            {category}
          </button>
        ))}
      </div>

      {/* Grower Groups */}
      {growerGroups.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
          <p className="text-gray-600 mb-4">No products available</p>
          <p className="text-sm text-gray-500">Check back later for new inventory</p>
        </div>
      ) : (
        growerGroups.map((group: any) => (
          <div key={group.growerId} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{group.growerName}</h2>
                <p className="text-sm text-gray-500">{group.products.length} products available</p>
              </div>
              <Link 
                href={`/dispensary/catalog?grower=${group.growerId}`}
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.products.map((product: any) => (
                  <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="h-48 bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">{product.category || 'Product'}</span>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        {product.strain && (
                          <Badge variant="secondary" className="text-xs">
                            {product.strain}
                          </Badge>
                        )}
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-bold text-green-600">
                          ${Number(product.price).toFixed(2)}/{product.unit}
                        </span>
                        <span className={`text-sm ${product.inventoryQty < 20 ? 'text-red-500' : 'text-gray-500'}`}>
                          {product.inventoryQty} in stock
                        </span>
                      </div>
                      {product.thc && (
                        <div className="flex justify-between items-center mb-3 text-sm text-gray-600">
                          <span>THC: {product.thc}%</span>
                        </div>
                      )}
                      <form action="/api/cart/add" method="POST" className="w-full">
                        <input type="hidden" name="productId" value={product.id} />
                        <input type="hidden" name="quantity" value="1" />
                        <button 
                          type="submit"
                          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add to Cart
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link 
          href="/dispensary/orders"
          className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">View Orders</p>
              <p className="text-sm text-gray-600">Check your order history</p>
            </div>
          </div>
        </Link>

        <Link 
          href="/dispensary/cart"
          className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">View Cart</p>
              <p className="text-sm text-gray-600">Review items before checkout</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
