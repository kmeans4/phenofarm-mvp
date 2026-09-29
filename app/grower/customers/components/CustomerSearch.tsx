'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
export function CustomerSearch({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const previous = useRef(initial);
  useEffect(() => {
    if (value === previous.current) return;
    const t = setTimeout(() => {
      previous.current = value;
      router.replace(
        `/grower/customers?${new URLSearchParams({ search: value })}`
      );
    }, 300);
    return () => clearTimeout(t);
  }, [value, router]);
  return (
    <label className="block text-sm">
      Search customers
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Name, email or city"
        className="mt-1 min-h-11 w-full rounded-lg border border-pf-line-strong bg-pf-raised px-3"
      />
    </label>
  );
}
