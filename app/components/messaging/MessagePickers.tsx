'use client';
import { useEffect, useState } from 'react';
export type QuoteProduct = {
  id: string;
  name: string;
  unit: string | null;
  price: number | null;
  inventoryQty: number;
};
export function QuoteProductPicker({
  conversationId,
  value,
  onChange,
}: {
  conversationId: string;
  value: string;
  onChange: (product: QuoteProduct) => void;
}) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<QuoteProduct[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(
        `/api/messages/conversations/${conversationId}/products?q=${encodeURIComponent(search)}&selected=${encodeURIComponent(value)}`,
        { signal: controller.signal }
      )
        .then(async (response) => {
          if (!response.ok) throw Error();
          setProducts((await response.json()).products);
          setError('');
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setError('Products could not load. Try another search.');
        });
    }, 200);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [conversationId, search, value]);
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Product</legend>
      <input
        type="search"
        aria-label="Search quote products"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search products"
        className="w-full rounded-lg border px-3 py-2 text-base"
      />
      <select
        aria-label="Quote product"
        required
        value={value}
        onChange={(event) => {
          const product = products.find((p) => p.id === event.target.value);
          if (product) onChange(product);
        }}
        className="w-full rounded-lg border px-3 py-2 text-base"
      >
        <option value="">Choose product</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} · {p.inventoryQty} {p.unit || 'unit'}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="text-sm text-pf-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
export function ConversationStart({
  role,
  onStarted,
}: {
  role: 'GROWER' | 'DISPENSARY';
  onStarted: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [contacts, setContacts] = useState<
    Array<{ id: string; businessName: string }>
  >([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/messages/contacts?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw Error();
          setContacts((await response.json()).contacts);
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setError('Could not load businesses. Try again.');
        });
    }, 200);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [q, open]);
  async function start(id: string) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          role === 'GROWER' ? { dispensaryId: id } : { growerId: id }
        ),
      });
      const data = await response.json();
      if (!response.ok)
        throw Error(data.error || 'Could not open conversation.');
      onStarted(data.conversationId);
      setOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="border-b border-pf-line p-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="min-h-11 text-sm font-semibold text-pf-accent"
      >
        {open ? 'Close picker' : 'New message'}
      </button>
      {open && (
        <div className="space-y-2">
          <input
            type="search"
            aria-label="Search businesses to message"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={
              role === 'GROWER' ? 'Find a dispensary' : 'Find a grower'
            }
            className="w-full rounded-lg border px-3 py-2 text-base"
          />
          <div className="max-h-48 overflow-y-auto">
            {contacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                disabled={busy}
                onClick={() => start(contact.id)}
                className="block min-h-11 w-full px-2 py-2 text-left text-sm hover:bg-pf-raised"
              >
                {contact.businessName}
              </button>
            ))}
          </div>
          {error && (
            <p role="alert" className="text-sm text-pf-danger">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
