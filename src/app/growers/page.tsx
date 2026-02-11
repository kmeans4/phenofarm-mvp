import Link from "next/link";

export default function GrowersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Grower Directory
        </h1>
        
        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Search growers..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-green-600 focus:outline-none"
          />
          <select className="rounded-lg border border-gray-300 px-4 py-2 focus:border-green-600 focus:outline-none">
            <option>Categories</option>
            <option>Flowers</option>
            <option>Concentrates</option>
            <option>Full Service</option>
          </select>
        </div>

        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                  Logo
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    Vermont Green Growers {i + 1}
                  </h3>
                  <p className="text-sm text-gray-600">Burlington, VT</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Licensed
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Metrc Sync
                    </span>
                  </div>
                </div>
              </div>
              <Link
                href="/growers/profile"
                className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                View Catalog
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
