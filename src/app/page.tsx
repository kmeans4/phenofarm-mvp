import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-green-900 mb-6">
          PhenoFarm
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
          The B2B wholesale marketplace connecting cannabis growers and dispensaries. 
          Simple. Affordable. Vermont-focused.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 bg-green-600 text-white rounded-lg text-lg font-medium hover:bg-green-700 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 border-2 border-green-600 text-green-600 rounded-lg text-lg font-medium hover:bg-green-50 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Why PhenoFarm?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              60% Cheaper than APEX
            </h3>
            <p className="text-gray-600">
              Core features only at $249/month vs $600 for bloated competitors.
              No pay for features you don't use.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Vermont Focused
            </h3>
            <p className="text-gray-600">
              Built specifically for Vermont's regulations and market. Less
              complexity, better local support.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Mobile First
            </h3>
            <p className="text-gray-600">
              Future mobile app built from Day 1. Manage your business from the
              greenhouse, not just your desk.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-5xl px-6 py-16 bg-gray-50">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-bold text-green-700 mb-4">
              For Growers
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li>✅ List products and manage inventory</li>
              <li>✅ Display live catalog to dispensaries</li>
              <li>✅ Receive and manage orders</li>
              <li>✅ Sync with Metrc for compliance</li>
              <li>✅ Track customer relationships</li>
            </ul>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-green-700 mb-4">
              For Dispensaries
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li>✅ Browse grower catalogs</li>
              <li>✅ Place orders in seconds</li>
              <li>✅ Track order status</li>
              <li>✅ Download invoices with COAs</li>
              <li>✅ Maintain order history</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">
          Ready to get started?
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Join PhenoFarm today and transform how you do business.
        </p>
        <Link
          href="/register"
          className="inline-block px-8 py-4 bg-green-600 text-white rounded-lg text-lg font-medium hover:bg-green-700 transition-colors"
        >
          Create Your Account
        </Link>
      </section>
    </div>
  );
}
