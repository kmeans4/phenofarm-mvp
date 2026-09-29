'use client';
import { useEffect, useRef, useState } from 'react';
import { toast } from '@/app/hooks/useToast';
import { formatProductUnit } from '@/lib/product-display';
import { parseInventoryQty } from '@/lib/product-payload';

export function InlineStock({
  id,
  name,
  quantity,
  unit,
  onSaved,
}: {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  onSaved: (quantity: number, available: boolean) => void;
}) {
  const [value, setValue] = useState(String(quantity)),
    [error, setError] = useState(''),
    [saving, setSaving] = useState(false),
    [conflict, setConflict] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    current = useRef(quantity),
    pending = useRef(false),
    queued = useRef<number | null>(null);
  useEffect(() => {
    if (!pending.current && !timer.current) {
      current.current = quantity;
      setValue(String(quantity));
    }
  }, [quantity]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  async function save(next: number) {
    if (next === current.current) return;
    if (pending.current) {
      queued.current = next;
      return;
    }
    pending.current = true;
    setSaving(true);
    setError('');
    setConflict(false);
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: id,
          quantityAvailable: next,
          expectedQuantity: current.current,
        }),
      });
      const data = await response.json();
      if (response.status === 409) {
        queued.current = null;
        const refresh = await fetch(`/api/products/${id}`);
        if (!refresh.ok)
          throw new Error(
            'Stock changed. Could not load the latest quantity. Retry.'
          );
        const latest = await refresh.json();
        current.current = latest.inventoryQty;
        setValue(String(latest.inventoryQty));
        onSaved(latest.inventoryQty, latest.isAvailable);
        setConflict(true);
        setError(
          'Stock changed elsewhere. Latest quantity shown; edit it to try again.'
        );
        return;
      }
      if (!response.ok)
        throw new Error(data.error || 'Stock could not be saved.');
      current.current = data.inventoryQty;
      onSaved(data.inventoryQty, data.isAvailable);
      toast.success('Stock saved', { id: `stock-${id}` });
    } catch (error) {
      queued.current = null;
      setError(
        error instanceof Error ? error.message : 'Connection lost. Retry.'
      );
    } finally {
      pending.current = false;
      setSaving(false);
      if (queued.current !== null) {
        const next = queued.current;
        queued.current = null;
        void save(next);
      }
    }
  }
  function change(next: string) {
    setValue(next);
    setError('');
    setConflict(false);
    if (timer.current) clearTimeout(timer.current);
    const parsed = parseInventoryQty(next);
    if (parsed === null) return;
    timer.current = setTimeout(() => {
      timer.current = null;
      void save(parsed);
    }, 600);
  }
  return (
    <div
      className="space-y-1"
      onBlurCapture={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null))
          return;
        if (timer.current) {
          clearTimeout(timer.current);
          timer.current = null;
          const next = parseInventoryQty(value);
          if (next !== null) void save(next);
        }
      }}
    >
      <div className="flex min-w-0 items-center gap-1">
        <button
          type="button"
          aria-label={`Reduce ${name} stock`}
          className="h-11 w-11 shrink-0 rounded-lg border border-pf-line-strong"
          onClick={() =>
            change(
              String(
                Math.max(0, (parseInventoryQty(value) ?? current.current) - 1)
              )
            )
          }
        >
          −
        </button>
        <input
          aria-label={`${name} stock in ${formatProductUnit(unit)}`}
          aria-invalid={Boolean(error)}
          inputMode="numeric"
          value={value}
          onChange={(event) => change(event.target.value)}
          onBlur={() => {
            const next = parseInventoryQty(value);
            if (next === null)
              setError(
                'Enter whole units. Use a smaller unit for partial weights.'
              );
            else setValue(String(next));
          }}
          className="h-11 w-16 min-w-0 rounded-lg border border-pf-line-strong bg-pf-raised px-1 text-center text-sm"
        />
        <button
          type="button"
          aria-label={`Increase ${name} stock`}
          className="h-11 w-11 shrink-0 rounded-lg border border-pf-line-strong"
          onClick={() =>
            change(
              String(
                Math.min(
                  999999,
                  (parseInventoryQty(value) ?? current.current) + 1
                )
              )
            )
          }
        >
          +
        </button>
        <span className="text-sm text-pf-muted">{formatProductUnit(unit)}</span>
      </div>
      {saving && (
        <span className="text-sm text-pf-muted" role="status">
          Saving…
        </span>
      )}
      {error && (
        <p className="max-w-56 text-sm text-pf-danger" role="alert">
          {error}{' '}
          {!conflict && (
            <button
              type="button"
              onClick={() => {
                const next = parseInventoryQty(value);
                if (next !== null) void save(next);
              }}
              className="underline"
            >
              Retry
            </button>
          )}
        </p>
      )}
    </div>
  );
}
