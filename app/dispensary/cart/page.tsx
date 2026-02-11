import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function DispensaryCartPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const cartItems = [
    { id: 1, name: 'Blue Dream Flower', grower: 'Green Valley Nurseries', price: 45, quantity: 2, strain: 'Indica' },
    { id: 2, name: 'Sativa Concentrate', grower: 'Vermont Green Works', price: 85, quantity: 1, strain: 'Sativa' },
    { id: 3, name: 'EDM Edibles', grower: 'Green Mountain Growers', price: 35, quantity: 3, strain: 'Hybrid' },
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        <div className="flex gap-4">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Continue Shopping
          </button>
          <button className="px-4 py-2 text-red-600 hover:text-red-900">
            Clear Cart
          </button>
        </div>
      </div>

      {/* Cart Items */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">{cartItems.length} Items in Cart</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {cartItems.map((item) => (
            <div key={item.id} className="px-6 py-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-gray-400">[Image]</span>
              </div>
              
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.strain} • {item.grower}</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button className="px-3 py-1 hover:bg-gray-100 text-gray-600">-</button>
                  <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                  <button className="px-3 py-1 hover:bg-gray-100 text-gray-600">+</button>
                </div>
                
                <span className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                
                <button className="text-red-600 hover:text-red-900 ml-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-md ml-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Order Summary</h2>
        </div>
        
        <div className="p-6space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax (10%)</span>
            <span className="font-medium">${tax.toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-200 pt-4 flex justify-between">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-lg font-bold text-green-600">${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 space-y-3">
          <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium">
            Checkout Now
          </button>
          
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-sm text-gray-500">or</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>
          
          <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 font-medium">
            Save Cart
          </button>
        </div>
      </div>

      {/* Savings Info */}
      <div className="bg-green-50 rounded-lg p-4 border border-green-200 max-w-md">
        <div className="flex items-start gap-3">
          <div className="text-green-600 mt-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-green-900">Free Shipping!</h3>
            <p className="text-sm text-green-700 mt-1">
              You're $150 away from free shipping on orders over $500
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
