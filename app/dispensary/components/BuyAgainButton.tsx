'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/app/hooks/useToast';
import {
  mergeCartItems,
  waitForCartSync,
  readCart,
  writeCart,
  type CartItem,
} from '@/lib/cart';
export function BuyAgainButton({
  items,
  label = 'Reorder',
}: {
  items: { productId: string; quantity: number }[];
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={busy}
      className="inline-flex min-h-11 items-center rounded-lg border border-pf-line-strong px-3 text-sm font-semibold text-pf-accent disabled:opacity-50"
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (busy) return;
        setBusy(true);
        try {
          const response = await fetch('/api/dispensary/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productIds: items.map((item) => item.productId),
            }),
          });
          const data = await response.json();
          if (!response.ok || !Array.isArray(data.products)) throw new Error();
          await waitForCartSync();
          const before = readCart();
          const additions: CartItem[] = [];
          let adjusted = 0;
          for (const requested of items) {
            const product = data.products.find(
              (value: { id: string }) => value.id === requested.productId
            );
            if (
              !product?.isAvailable ||
              product.price == null ||
              product.inventoryQty < 1
            )
              continue;
            const quantity = Math.min(
              requested.quantity,
              Math.max(
                0,
                product.inventoryQty -
                  (before.items.find((item) => item.id === product.id)
                    ?.quantity || 0)
              )
            );
            if (quantity < 1) continue;
            if (quantity < requested.quantity) adjusted++;
            additions.push({
              id: product.id,
              name: product.name,
              quantity,
              price: product.price,
              maxQty: product.inventoryQty,
              growerId: product.grower.id,
              grower: product.grower.businessName,
              unit: product.unit,
              image:
                product.images?.[0] ||
                `/api/dispensary/products/${product.id}/thumbnail`,
              productType: product.productType,
            });
          }
          if (additions.length) writeCart(mergeCartItems(before, additions));
          toast[additions.length ? 'success' : 'info'](
            `Added ${additions.length} of ${items.length}${items.length > additions.length ? ` — ${items.length - additions.length} unavailable or need a price` : ''}${adjusted ? ` · ${adjusted} quantities reduced to available stock` : ''}`,
            {
              action: {
                label: 'View cart',
                onClick: () => router.push('/dispensary/cart'),
              },
            }
          );
        } catch {
          toast.error('Could not check current products. Please retry.');
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? 'Checking…' : label}
    </button>
  );
}
