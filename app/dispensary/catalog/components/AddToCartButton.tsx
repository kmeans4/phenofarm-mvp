'use client';

import { useState } from 'react';
import { Plus, Check, ShoppingCart } from "lucide-react";

interface ProductData {
  id: string;
  name: string;
  price: number;
  strain: string | null;
  unit: string | null;
  thc: number | null;
  inventoryQty: number;
}

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
  thc?: number;
}

export default function AddToCartButton({ 
  product, 
  growerName, 
  growerId,
  compact = false
}: { 
  product: ProductData; 
  growerName: string;
  growerId: string;
  compact?: boolean;
}) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  const addToCart = (qty: number = quantity) => {
    if (qty < 1 || qty > product.inventoryQty) {
      alert(`Please select quantity between 1 and ${product.inventoryQty}`);
      return;
    }
    
    setLoading(true);
    
    const saved = localStorage.getItem('phenofarm-cart');
    let cart = { items: [] as CartItem[], subtotal: 0, tax: 0, total: 0 };
    
    if (saved) {
      try {
        cart = JSON.parse(saved);
      } catch {
        // use default
      }
    }
    
    const existingIndex = cart.items.findIndex((item: CartItem) => item.id === product.id);
    
    if (existingIndex >= 0) {
      const newQty = cart.items[existingIndex].quantity + qty;
      if (newQty > product.inventoryQty) {
        alert(`Cannot add ${qty} more. Only ${product.inventoryQty - cart.items[existingIndex].quantity} available.`);
        setLoading(false);
        return;
      }
      cart.items[existingIndex].quantity = newQty;
    } else {
      cart.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        grower: growerName,
        growerId: growerId,
        quantity: qty,
        maxQty: product.inventoryQty,
        strain: product.strain || undefined,
        unit: product.unit || undefined,
        thc: product.thc || undefined,
      });
    }
    
    cart.subtotal = cart.items.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0);
    cart.tax = cart.subtotal * 0.1;
    cart.total = cart.subtotal + cart.tax;
    
    localStorage.setItem('phenofarm-cart', JSON.stringify(cart));
    
    setAdded(true);
    setLoading(false);
    setQuantity(1);
    
    setTimeout(() => setAdded(false), 2000);
    window.dispatchEvent(new Event('cart-updated'));
  };

  // Compact mode for list view - single click to add 1 unit
  if (compact) {
    return (
      <button 
        onClick={() => addToCart(1)}
        disabled={loading || product.inventoryQty < 1 || added}
        className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
          added 
            ? 'bg-green-700 text-white' 
            : product.inventoryQty < 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
        }`}
        title={product.inventoryQty < 1 ? 'Out of Stock' : 'Quick Add (1 unit)'}
      >
        {loading ? (
          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : added ? (
          <Check size={20} />
        ) : (
          <Plus size={20} />
        )}
      </button>
    );
  }

  // Full mode for grid view
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-600">Quantity:</label>
        <div className="flex items-center border border-gray-300 rounded-lg">
          <button 
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={loading}
            className="px-3 py-1 hover:bg-gray-100 text-gray-600 disabled:opacity-50"
          >
            -
          </button>
          <input
            type="number"
            min={1}
            max={product.inventoryQty}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(product.inventoryQty, parseInt(e.target.value) || 1)))}
            className="w-12 text-center text-sm py-1 border-x border-gray-300 focus:outline-none no-arrows"
            style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
          />
          <button 
            onClick={() => setQuantity(Math.min(product.inventoryQty, quantity + 1))}
            disabled={loading}
            className="px-3 py-1 hover:bg-gray-100 text-gray-600 disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>
      
      <button 
        onClick={() => addToCart()}
        disabled={loading || product.inventoryQty < 1}
        className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors ${
          added 
            ? 'bg-green-700 text-white' 
            : product.inventoryQty < 1
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {loading ? (
          '...'
        ) : added ? (
          <>
            <Check size={18} />
            Added!
          </>
        ) : product.inventoryQty < 1 ? (
          <>
            <ShoppingCart size={18} />
            Out of Stock
          </>
        ) : (
          <>
            <Plus size={18} />
            Add to Cart
          </>
        )}
      </button>
      
      <p className="text-xs text-gray-500 text-center">
        {product.inventoryQty} available
      </p>
    </div>
  );
}
