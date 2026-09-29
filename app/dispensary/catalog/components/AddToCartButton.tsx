'use client';

import { formatProductUnit } from '@/lib/product-display';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  readCart,
  writeCart,
  mergeCartItems,
  normalizeCart,
  waitForCartSync,
} from '@/lib/cart';
import { Plus, Check } from 'lucide-react';
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
  const router = useRouter();
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);
  const [availableQuantity, setAvailableQuantity] = useState(
    product.inventoryQty
  );
  const numeric = Number(quantity.replace(/[,\s]/g, ''));
  const soldOut = product.inventoryQty < 1;
  async function add() {
    await waitForCartSync();
    const before = readCart();
    const existing = before.items.find((item) => item.id === product.id);
    const remaining = Math.max(
      0,
      product.inventoryQty - (existing?.quantity ?? 0)
    );
    setAvailableQuantity(remaining);
    if (!Number.isSafeInteger(numeric) || numeric < 1) {
      setError('Enter a whole number of 1 or more.');
      return;
    }
    if (numeric > remaining) {
      setError(
        `Only ${remaining} more available${existing ? ` (${existing.quantity} in your cart)` : ''}.`
      );
      return;
    }
    if (product.price == null) {
      setError('Ask the grower for a price first.');
      return;
    }
    writeCart(
      mergeCartItems(before, [
        {
          id: product.id,
          name: product.name,
          grower: growerName,
          growerId,
          price: product.price,
          quantity: numeric,
          maxQty: product.inventoryQty,
          strain: product.strain ?? undefined,
          unit: product.unit ?? 'unit',
          image:
            product.images?.[0] ||
            `/api/dispensary/products/${product.id}/thumbnail`,
          productType: product.productType ?? undefined,
        },
      ])
    );
    setError('');
    setAdded(true);
    toast.success(`Added ${numeric} × ${product.name}`, {
      action: {
        label: 'View cart',
        onClick: () => router.push('/dispensary/cart'),
      },
      cancel: {
        label: 'Undo',
        onClick: () => {
          const cart = readCart();
          writeCart(
            normalizeCart({
              items: cart.items.flatMap((item) =>
                item.id !== product.id
                  ? [item]
                  : item.quantity > numeric
                    ? [{ ...item, quantity: item.quantity - numeric }]
                    : []
              ),
            })
          );
        },
      },
    });
  }
  return (
    <div className={compact ? 'min-w-0 space-y-1' : 'space-y-2'}>
      <div
        className={`flex flex-wrap items-center gap-2 ${compact ? '' : 'sm:justify-between'}`}
      >
        <div className="flex overflow-hidden rounded-lg border border-pf-line-strong">
          <button
            type="button"
            aria-label={`Decrease quantity for ${product.name}`}
            disabled={soldOut || !Number.isSafeInteger(numeric) || numeric <= 1}
            onClick={() => {
              setQuantity(String(numeric - 1));
              setAdded(false);
            }}
            className="h-11 w-11 disabled:opacity-40"
          >
            −
          </button>
          <input
            aria-label={`Quantity for ${product.name}`}
            aria-invalid={!!error}
            type="text"
            inputMode="numeric"
            value={quantity}
            disabled={soldOut}
            onChange={(event) => {
              setQuantity(event.target.value);
              setAdded(false);
              setError('');
            }}
            className="h-11 w-12 min-w-0 border-x border-pf-line-strong bg-transparent text-center text-base"
          />
          <button
            type="button"
            aria-label={`Increase quantity for ${product.name}`}
            disabled={
              soldOut ||
              !Number.isSafeInteger(numeric) ||
              numeric >= product.inventoryQty
            }
            onClick={() => {
              setQuantity(String(Math.max(1, numeric + 1)));
              setAdded(false);
            }}
            className="h-11 w-11 disabled:opacity-40"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={soldOut}
          aria-label={`Add ${product.name} to cart`}
          className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-[#032116] hover:bg-emerald-400 disabled:opacity-40"
        >
          {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {soldOut ? 'Sold out' : compactLabel || 'Add'}
        </button>
      </div>
      {error && (
        <div role="alert" className="text-sm text-pf-warning">
          {error}
          {numeric > availableQuantity && availableQuantity > 0 && (
            <button
              className="ml-2 min-h-11 underline"
              onClick={() => {
                setQuantity(String(availableQuantity));
                setError('');
              }}
            >
              Set to {availableQuantity}
            </button>
          )}
        </div>
      )}
      {!compact && (
        <p className="text-center text-sm text-pf-muted">
          {product.inventoryQty} {formatProductUnit(product.unit)} available
        </p>
      )}
    </div>
  );
}
