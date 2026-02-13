'use client';

import { useState } from 'react';

interface ProductData {
  id: string;
  name: string;
  price: number;
  strain: string | null;
  unit: string | null;
  thc: number | null;
}

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

export default function AddToCartButton({ 
  product, 
  growerName, 
  growerId 
}: { 
  product: ProductData; 
  growerName: string;
  growerId: string;
}) {
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  const addToCart = () => {
    setLoading(true);
    
    // Get existing cart
    const saved = localStorage.getItem('phenofarm-cart');
    let cart = { items: [] as CartItem[], subtotal: 0, tax: 0, total: 0 };
    
    if (saved) {
      try {
        cart = JSON.parse(saved);
      } catch {
        // use default
      }
    }
    
    // Check if item already exists
    const existingIndex = cart.items.findIndex((item: CartItem) => item.id === product.id);
    
    if (existingIndex >= 0) {
      // Update quantity
      cart.items[existingIndex].quantity += 1;
    } else {
      // Add new item
      cart.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        grower: growerName,
        growerId: growerId,
        quantity: 1,
        strain: product.strain || undefined,
        unit: product.unit || undefined,
        thc: product.thc || undefined,
      });
    }
    
    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0);
    cart.tax = cart.subtotal * 0.1;
    cart.total = cart.subtotal + cart.tax;
    
    // Save to localStorage
    localStorage.setItem('phenofarm-cart', JSON.stringify(cart));
    
    // Show success state
    setAdded(true);
    setLoading(false);
    
    // Reset after 2 seconds
    setTimeout(() => setAdded(false), 2000);
    
    // Dispatch custom event so header can update cart count
    window.dispatchEvent(new Event('cart-updated'));
  };

  return (
    <button 
      onClick={addToCart}
      disabled={loading}
      className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors ${
        added 
          ? 'bg-green-700 text-white' 
          : 'bg-green-600 text-white hover:bg-green-700'
      }`}
    >
      {loading ? (
        '...'
      ) : added ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Added!
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add to Cart
        </>
      )}
    </button>
  );
}
