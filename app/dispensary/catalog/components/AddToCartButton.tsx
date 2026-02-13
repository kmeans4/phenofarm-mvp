'use client';

import { useState } from 'react';

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
  growerId 
}: { 
  product: ProductData; 
  growerName: string;
  growerId: string;
}) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  const addToCart = () => {
    if (quantity < 1 || quantity > product.inventoryQty) {
      alert(`Please select quantity between 1 and ${product.inventoryQty}`);
      return;
    }
    
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
      // Check if adding more would exceed inventory
      const newQty = cart.items[existingIndex].quantity + quantity;
      if (newQty > product.inventoryQty) {
        alert(`Cannot add ${quantity} more. Only ${product.inventoryQty - cart.items[existingIndex].quantity} available.`);
        setLoading(false);
        return;
      }
      cart.items[existingIndex].quantity = newQty;
    } else {
      // Add new item
      cart.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        grower: growerName,
        growerId: growerId,
        quantity: quantity,
        maxQty: product.inventoryQty,
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
    setQuantity(1);
    
    // Reset after 2 seconds
    setTimeout(() => setAdded(false), 2000);
    
    // Dispatch custom event
    window.dispatchEvent(new Event('cart-updated'));
  };

  return (
    <div className="space-y-2">
      {/* Quantity Selector */}
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
            className="w-12 text-center text-sm py-1 border-x border-gray-300 focus:outline-none [appearance:textfield] [className="w-12 text-center text-sm py-1 border-x border-gray-300 focus:outline-none"::-webkit-outer-spin-button]:appearance-none [className="w-12 text-center text-sm py-1 border-x border-gray-300 focus:outline-none"::-webkit-inner-spin-button]:appearance-none"
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
      
      {/* Add Button */}
      <button 
        onClick={addToCart}
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Added!
          </>
        ) : product.inventoryQty < 1 ? (
          'Out of Stock'
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add to Cart
          </>
        )}
      </button>
      
      {/* Stock info */}
      <p className="text-xs text-gray-500 text-center">
        {product.inventoryQty} available
      </p>
    </div>
  );
}
