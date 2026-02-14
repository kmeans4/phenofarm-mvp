'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';

interface CartItem {
  id: string;
  name: string;
  grower: string;
  growerId: string;
  price: number;
  quantity: number;
  maxQty: number;
  strain?: string;
  unit?: string;
}

interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export default function DispensaryCartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart>({ items: [], subtotal: 0, tax: 0, total: 0 });
  const [mounted, setMounted] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

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
    const tax = subtotal * 0.06;
    return { subtotal, tax, total: subtotal + tax };
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      const items = prev.items.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          if (delta > 0 && newQty > item.maxQty) return item;
          if (newQty < 1) return item;
          return { ...item, quantity: newQty };
        }
        return item;
      });
      return { items, ...calculateTotals(items) };
    });
  };

  const setExactQuantity = (id: string, qty: number) => {
    if (qty < 1) return;
    setCart(prev => {
      const items = prev.items.map(item => {
        if (item.id === id) {
          return { ...item, quantity: Math.min(qty, item.maxQty) };
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

  const handleCheckout = async () => {
    if (!confirm('Place order? This will deduct inventory.')) return;
    setCheckingOut(true);
    setCheckoutError('');

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart.items }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Checkout failed');

      localStorage.removeItem('phenofarm-cart');
      setCart({ items: [], subtotal: 0, tax: 0, total: 0 });
      setCheckoutSuccess(true);
      setTimeout(() => router.push('/dispensary/orders'), 2000);
    } catch (err: unknown) {
      setCheckoutError(err.message);
    } finally {
      setCheckingOut(false);
    }
  };

  if (!mounted) return <div className="p-6">Loading...</div>;

  if (checkoutSuccess) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold">Order Placed!</h1>
        <p className="text-gray-600">Redirecting to orders...</p>
      </div>
    );
  }

  const isEmpty = cart.items.length === 0;

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>

      {checkoutError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{checkoutError}</div>
      )}

      {isEmpty ? (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <Link href="/dispensary/catalog" className="text-green-600">Browse Products</Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map(item => {
              const atMax = item.quantity >= item.maxQty;
              return (
                <Card key={item.id}>
                  <CardContent className="p-4 flex gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">🌿</div>
                    <div className="flex-1">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.grower} • ${item.price}/{item.unit}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border rounded">
                        <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1">-</button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => setExactQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="w-12 text-center py-1 border-x"
                        />
                        <button 
                          onClick={() => updateQuantity(item.id, 1)} 
                          disabled={atMax}
                          className="px-3 py-1 disabled:opacity-30"
                        >+</button>
                      </div>
                      <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                      <button onClick={() => removeItem(item.id)} className="text-red-600">🗑️</button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="h-fit">
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between"><span>Subtotal</span><span>${cart.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>${cart.tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold"><span>Total</span><span>${cart.total.toFixed(2)}</span></div>
              <button 
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {checkingOut ? 'Processing...' : 'Place Order'}
              </button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
