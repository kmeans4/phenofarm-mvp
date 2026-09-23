'use client';

import { useEffect, useRef, useState } from 'react';
import { readCart, writeCart, mergeCartItems } from '@/lib/cart';
import { Plus, Check, ClipboardList, Loader2 } from "lucide-react";
import { toast } from '@/app/hooks/useToast';

interface ProductData {
  id: string;
  name: string;
  price: number | null;
  strain: string | null;
  unit: string | null;
  thc: number | null;
  inventoryQty: number;
  images?: string[];
  productType?: string | null;
}

export default function AddToCartButton({
  product,
  growerName,
  growerId,
  compact = false,
  compactLabel,
}: {
  product: ProductData;
  growerName: string;
  growerId: string;
  compact?: boolean;
  compactLabel?: string;
}) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (resetTimer.current) clearTimeout(resetTimer.current); }, []);

  const addToCart = (qty: number = quantity) => {
    if (qty < 1 || qty > product.inventoryQty) {
      toast.warning(`Select quantity between 1 and ${product.inventoryQty}`);
      return;
    }

    if (product.price == null) { toast.warning('Request pricing before adding this product.'); return; }
    const cart = readCart();
    const existing = cart.items.find(item => item.id === product.id);
    if ((existing?.quantity ?? 0) + qty > product.inventoryQty) {
      toast.warning('The requested quantity exceeds available inventory.'); return;
    }
    setLoading(true);
    const next = mergeCartItems(cart, [{ id: product.id, name: product.name, price: product.price,
      grower: growerName, growerId, quantity: qty, maxQty: product.inventoryQty,
      strain: product.strain ?? undefined, unit: product.unit ?? 'unit',
      image: product.images?.[0], productType: product.productType ?? undefined }]);
    if (!writeCart(next)) { toast.warning('Unable to save your request draft. Free up browser storage and try again.'); setLoading(false); return; }
    setAdded(true); setLoading(false); setQuantity(1);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setAdded(false), 2000);
  };

  const isOutOfStock = product.inventoryQty < 1;
  const isLowStock = product.inventoryQty > 0 && product.inventoryQty <= 10;

  // Compact mode for list view - single click to add 1 unit
  if (compact) {
    return (
      <button type="button"
        aria-label={`Add ${product.name} to request draft`}
        onClick={() => addToCart(1)}
        disabled={loading || isOutOfStock || added}
        className={`
          min-h-10 rounded-lg flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas
          ${compactLabel ? 'px-4 py-2 text-sm font-semibold' : 'p-2.5'}
          ${added
            ? 'bg-emerald-500 text-[#032116]'
            : isOutOfStock
              ? 'bg-pf-surface text-pf-muted cursor-not-allowed'
              : loading
                ? 'bg-emerald-500 text-[#032116] cursor-wait'
                : 'bg-emerald-500 text-[#032116] hover:bg-emerald-400'
          }
        `}
        title={isOutOfStock ? 'Out of stock' : `Add 1 unit to request draft • ${product.inventoryQty} in stock`}
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : added ? (
          <Check size={20} />
        ) : isOutOfStock ? (
          <ClipboardList size={20} className="opacity-50" />
        ) : (
          <Plus size={20} />
        )}
        {compactLabel && (
          <span>{loading ? 'Adding...' : added ? 'Added' : isOutOfStock ? 'Out of stock' : compactLabel}</span>
        )}
      </button>
    );
  }

  // Full mode for grid view
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2 sm:block sm:space-y-2">
      <div className="flex items-center justify-between">
        <span className="hidden text-sm text-pf-muted font-medium sm:inline">Qty:</span>
        <div className="flex items-center border border-pf-line-strong rounded-lg overflow-hidden focus-within:border-emerald-400 transition-colors">
          <button type="button"
            aria-label={`Decrease quantity for ${product.name}`}
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={loading || isOutOfStock}
            className="h-10 w-10 shrink-0 hover:bg-pf-raised text-pf-secondary disabled:opacity-40 transition-colors font-medium"
          >
            −
          </button>
          <input
            aria-label={`Quantity for ${product.name}`}
            type="number"
            min={1}
            max={product.inventoryQty}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(product.inventoryQty, parseInt(e.target.value) || 1)))}
            className="h-10 w-11 min-w-0 text-center text-base border-x border-pf-line-strong focus:outline-none bg-transparent font-medium sm:w-14"
            disabled={loading || isOutOfStock}
          />
          <button type="button"
            aria-label={`Increase quantity for ${product.name}`}
            onClick={() => setQuantity(Math.min(product.inventoryQty, quantity + 1))}
            disabled={loading || isOutOfStock}
            className="h-10 w-10 shrink-0 hover:bg-pf-raised text-pf-secondary disabled:opacity-40 transition-colors font-medium"
          >
            +
          </button>
        </div>
      </div>

      <button type="button"
        aria-label={loading ? 'Adding to draft' : added ? 'Added to draft' : isOutOfStock ? 'Out of stock' : 'Add to draft'}
        onClick={() => addToCart()}
        disabled={loading || isOutOfStock}
        className={`
          min-h-11 w-full px-2 py-2.5 rounded-lg flex items-center justify-center gap-1 text-sm font-semibold transition-colors sm:gap-2
          ${added
            ? 'bg-emerald-500 text-[#032116]'
            : isOutOfStock
              ? 'bg-pf-raised text-pf-muted cursor-not-allowed'
              : loading
                ? 'bg-emerald-500 text-[#032116] cursor-wait'
                : 'bg-emerald-500 text-[#032116] hover:bg-emerald-400'
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
            <span>Added<span className="hidden sm:inline"> to draft</span></span>
          </>
        ) : isOutOfStock ? (
          <>
            <ClipboardList size={18} />
            <span>Out of stock</span>
          </>
        ) : (
          <>
            <Plus size={18} />
            <span>Add<span className="hidden sm:inline"> to draft</span></span>
          </>
        )}
      </button>

      <div className="col-span-2 flex items-center justify-center gap-2">
        <span className={`text-xs ${isOutOfStock ? 'text-pf-danger' : isLowStock ? 'text-pf-warning' : 'text-pf-muted'}`}>
          {isOutOfStock ? 'Out of stock' : isLowStock ? `Only ${product.inventoryQty} left` : `${product.inventoryQty} available`}
        </span>
      </div>
    </div>
  );
}
