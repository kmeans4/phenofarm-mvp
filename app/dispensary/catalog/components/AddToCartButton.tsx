'use client';

import { useState } from 'react';
import { Plus, Check, ShoppingCart, Loader2 } from "lucide-react";

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
    
    // Simulate async operation for better UX
    setTimeout(() => {
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
    }, 300); // Small delay for better UX feedback
  };

  const isOutOfStock = product.inventoryQty < 1;
  const isLowStock = product.inventoryQty > 0 && product.inventoryQty <= 10;

  // Compact mode for list view - single click to add 1 unit
  if (compact) {
    return (
      <button 
        onClick={() => addToCart(1)}
        disabled={loading || isOutOfStock || added}
        className={`
          p-2.5 rounded-lg flex items-center justify-center transition-all duration-200
          ${added 
            ? 'bg-green-700 text-white scale-105 shadow-md' 
            : isOutOfStock
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : loading
                ? 'bg-green-600 text-white cursor-wait'
                : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105 hover:shadow-md active:scale-95'
          }
        `}
        title={isOutOfStock ? 'Out of Stock' : `Quick Add (1 unit) • ${product.inventoryQty} in stock`}
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : added ? (
          <Check size={20} className="animate-bounce" />
        ) : isOutOfStock ? (
          <ShoppingCart size={20} className="opacity-50" />
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
        <label className="text-sm text-gray-600 font-medium">Qty:</label>
        <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden focus-within:border-green-500 transition-colors">
          <button 
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={loading || isOutOfStock}
            className="px-3 py-1.5 hover:bg-gray-100 text-gray-600 disabled:opacity-40 transition-colors font-medium"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={product.inventoryQty}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(product.inventoryQty, parseInt(e.target.value) || 1)))}
            className="w-14 text-center text-sm py-1.5 border-x-2 border-gray-200 focus:outline-none bg-transparent font-medium"
            disabled={loading || isOutOfStock}
          />
          <button 
            onClick={() => setQuantity(Math.min(product.inventoryQty, quantity + 1))}
            disabled={loading || isOutOfStock}
            className="px-3 py-1.5 hover:bg-gray-100 text-gray-600 disabled:opacity-40 transition-colors font-medium"
          >
            +
          </button>
        </div>
      </div>
      
      <button 
        onClick={() => addToCart()}
        disabled={loading || isOutOfStock}
        className={`
          w-full py-2.5 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all duration-200
          ${added 
            ? 'bg-green-700 text-white shadow-md scale-[1.02]' 
            : isOutOfStock
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : loading
                ? 'bg-green-600 text-white cursor-wait'
                : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]'
          }
        `}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Adding...</span>
          </>
        ) : added ? (
          <>
            <Check size={18} />
            <span>Added to Cart!</span>
          </>
        ) : isOutOfStock ? (
          <>
            <ShoppingCart size={18} />
            <span>Out of Stock</span>
          </>
        ) : (
          <>
            <Plus size={18} />
            <span>Add to Cart</span>
          </>
        )}
      </button>
      
      <div className="flex items-center justify-center gap-2">
        <span className={`text-xs ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-orange-500' : 'text-gray-500'}`}>
          {isOutOfStock ? 'Unavailable' : isLowStock ? `Only ${product.inventoryQty} left!` : `${product.inventoryQty} available`}
        </span>
      </div>
    </div>
  );
}
