import Link from "next/link";

export default function CatalogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Dispensary Catalog
        </h1>
        
        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Search products..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-green-600 focus:outline-none"
          />
          <select className="rounded-lg border border-gray-300 px-4 py-2 focus:border-green-600 focus:outline-none">
            <option>Categories</option>
            <option>Flowers</option>
            <option>Concentrates</option>
            <option>Edibles</option>
            <option>Topicals</option>
          </select>
          <select className="rounded-lg border border-gray-300 px-4 py-2 focus:border-green-600 focus:outline-none">
            <option>Sort by</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Alphabetical</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center text-gray-500">
                Product Image
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Premium Vermont Bud {i + 1}
              </h3>
              <p className="text-sm text-gray-600 mb-2">Indica • 22% THC</p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-lg font-bold text-green-700">
                  ${((10 + i * 5) * 10).toFixed(2)}
                </span>
                <span className="text-sm text-gray-500">28g</span>
              </div>
              <button className="mt-4 w-full rounded bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700">
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
