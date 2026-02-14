import Navbar from '@/app/components/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Connect. Grow. <span className="text-green-600">Thrive.</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The affordable B2B marketplace for cannabis wholesale. Connect with verified growers and dispensaries. Start saving up to 60% compared to traditional platforms.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#features" className="px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
                Get Started Now - $249/mo
              </a>
              <a href="#how-it-works" className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose PhenoFarm?</h2>
            <p className="text-gray-600">Premium features at half the price of competitors</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Affordable Pricing</h3>
              <p className="text-gray-600">Only $249/month vs APEX Trading&apos;s $600/month. Save 60% while getting better features.</p>
            </div>
            
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🌱</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Growers</h3>
              <p className="text-gray-600">Connect with licensed, verified cannabis cultivators in your region.</p>
            </div>
            
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🏪</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Dispensary Access</h3>
              <p className="text-gray-600">Browse and purchase from top-tier dispensaries across Vermont and beyond.</p>
            </div>
            
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Mobile Friendly</h3>
              <p className="text-gray-600">Full access on the go with our responsive mobile-optimized platform.</p>
            </div>
            
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Transactions</h3>
              <p className="text-gray-600">Bank-level security for all your transactions and data.</p>
            </div>
            
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Analytics & Insights</h3>
              <p className="text-gray-600">Track your business performance with comprehensive reporting tools.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600">Simple, streamlined wholesale cannabis trading</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-6">For Growers</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0">1</div>
                  <div>
                    <h4 className="font-semibold">List Your Products</h4>
                    <p className="text-gray-600">Upload your inventory with detailed product information and pricing.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0">2</div>
                  <div>
                    <h4 className="font-semibold">Receive Orders</h4>
                    <p className="text-gray-600">Get orders from verified dispensaries looking for quality products.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0">3</div>
                  <div>
                    <h4 className="font-semibold">Process & Ship</h4>
                    <p className="text-gray-600">Manage your warehouse and shipping through our integrated system.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-semibold mb-6">For Dispensaries</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">1</div>
                  <div>
                    <h4 className="font-semibold">Browse Catalog</h4>
                    <p className="text-gray-600">Explore products from multiple growers in one place.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">2</div>
                  <div>
                    <h4 className="font-semibold">Place Orders</h4>
                    <p className="text-gray-600">Order with flexible quantities and track order status in real-time.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">3</div>
                  <div>
                    <h4 className="font-semibold">Manage Inventory</h4>
                    <p className="text-gray-600">Keep track of your wholesale purchases and sales data.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-600 mb-8">Choose the plan that works best for your business</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Trial */}
            <div className="border border-gray-200 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Free Trial</h3>
              <div className="text-4xl font-bold mb-2">$0 <span className="text-gray-500 text-lg">/mo</span></div>
              <p className="text-gray-600 mb-6">Test our platform risk-free</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>30-day free trial</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Basic features included</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Standard support</span>
                </li>
              </ul>
              <a href="#" className="block text-center bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors">
                Get Started
              </a>
            </div>
            
            {/* Pro Plan */}
            <div className="border-2 border-green-600 rounded-lg p-8 bg-gray-50 relative">
              <div className="absolute top-0 right-0 bg-green-600 text-white text-sm px-3 py-1 rounded-bl-lg">
                MOST POPULAR
              </div>
              <h3 className="text-xl font-semibold mb-4">Wholesale Pro</h3>
              <div className="text-4xl font-bold mb-2">$249 <span className="text-gray-500 text-lg">/mo</span></div>
              <p className="text-gray-600 mb-6">Complete wholesale platform</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Unlimited products</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>CSV bulk upload</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Metrc integration ready</span>
                </li>
              </ul>
              <a href="/auth/sign_up" className="block text-center bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors">
                Start 30-Day Free Trial
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to transform your cannabis wholesale business?
          </h2>
          <p className="text-green-100 text-lg mb-8">
            Join PhenoFarm today and start saving up to 60% on your wholesale platform costs.
          </p>
          <a href="/auth/sign_up" className="inline-block bg-white text-green-600 font-semibold py-4 px-8 rounded-lg hover:bg-gray-100 transition-colors">
            Start Your Free Trial
          </a>
          <p className="mt-4 text-green-200 text-sm">No credit card required for trial</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold mb-4">PhenoFarm</h3>
              <p className="text-sm">The affordable B2B marketplace connecting cannabis growers and dispensaries.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">For Growers</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Sell Your Products</a></li>
                <li><a href="#" className="hover:text-white">Grower Dashboard</a></li>
                <li><a href="#" className="hover:text-white">Success Stories</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">For Dispensaries</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Browse Products</a></li>
                <li><a href="#" className="hover:text-white">Dispensary Dashboard</a></li>
                <li><a href="#" className="hover:text-white">Purchasing Guide</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2024 PhenoFarm. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
