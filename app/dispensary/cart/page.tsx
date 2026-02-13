'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';

interface CartItem {
  id: string;
  name: string;
  grower: string;
  growerId: string;
  price: number;
  quantity: number;
  strain?: string;
  unit?: string;
  thc?: number;
}

interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export default function DispensaryCartPage() {
  const [cart, setCart] = useState<Cart>({ items: [], subtotal: 0, tax: 0, total: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('phenofarm-cart');
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch {
        setCart({ items: [], subtotal: 0, tax: 0, total: 0 });
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('phenofarm-cart', JSON.stringify(cart));
    }
  }, [cart, mounted]);

  const calculateTotals = (items: CartItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      const items = prev.items.map(item => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      });
      return { items, ...calculateTotals(items) };
    });
  };

  const removeItem = (id: string) => {
    setCart(prev => {
      const items = prev.items.filter(item => item.id !== id);
      return { items, ...calculateTotals(items) };
    });
  };

  const clearCart = () => {
    if (confirm('Clear cart?')) {
      setCart({ items: [], subtotal: 0, tax: 0, total: 0 });
    }
  };

  if (!mounted) return <div className="p-6">Loading...</div>;

  const isEmpty = cart.items.length === 0;

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-1">
            {isEmpty ? 'Your cart is empty' : `${cart.items.reduce((s, i) => s + i.quantity, 0)} items`}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dispensary/catalog" className="px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium">
            Continue Shopping
          </Link>
          {!isEmpty && (
            <button onClick={clearCart} className="px-4 py-2 text-red-600 hover:text-red-900">
              Clear Cart
            </button>
          )}
        </div>
      </div>

      {isEmpty ? (
        <Card className="p-12">
          <div className="text-center">
            <div>🛒</div>
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Browse our catalogs</p>
            <Link href="/dispensary/catalog" className="bg-green-600 text-white px-6 py-3 rounded-lg">
              Browse
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {cart.items.map(item => (
                    <div key={item.id} className="p-4 flex gap-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">🌿</div>
                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.strain} • {item.grower}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border rounded-lg">
                          <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1 hover:bg-gray-100">-</button>
                          <span className="px-3">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="px-3 py-1 hover:bg-gray-100">+</button>
                        </div>
                        <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                        <button onClick={() => removeItem(item.id)} className="text-red-600">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between"><span>Subtotal</span><span>${cart.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>${cart.tax.toFixed(2)}</span></div>
                <div className="border-t pt-4 flex justify-between font-bold">
                  <span>Total</span><span className="text-green-600">${cart.total.toFixed(2)}</span>
                </div>
                <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700">
                  Checkout
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
