'use client';

import { useEffect, useState } from 'react';

type ProductOptionsResult<T> = { key: string; query: string; view: string; options: T[]; hasMore: boolean; error: string };

export function useGrowerProductOptions<T extends { id: string }>(search: string, view = 'all') {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState(search);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<ProductOptionsResult<T> | null>(null);
  const key = JSON.stringify([query, view, page, attempt]);
  const loading = search !== query || result?.key !== key;
  const sameFilter = result?.query === query && result?.view === view;
  useEffect(() => {
    if (search === query) return;
    const timer = setTimeout(() => { setQuery(search); setPage(1); }, 250);
    return () => clearTimeout(timer);
  }, [search, query]);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/products?${new URLSearchParams({ search: query, view, page: String(page), pageSize: '25' })}`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Could not load products. Try again.');
        const data = await response.json();
        if (!Array.isArray(data.products)) throw new Error('Could not load products. Try again.');
        if (!controller.signal.aborted) setResult(previous => ({
          key, query, view, error: '', hasMore: data.page * data.pageSize < data.total,
          options: page === 1 || previous?.query !== query || previous?.view !== view ? data.products
            : [...new Map([...previous.options, ...data.products].map(product => [product.id, product])).values()] as T[],
        }));
      }).catch(error => {
        if (!controller.signal.aborted) setResult(previous => ({
          key, query, view, error: error.message, hasMore: true,
          options: previous?.query === query && previous?.view === view ? previous.options : [],
        }));
      });
    return () => controller.abort();
  }, [query, page, view, key]);
  return {
    options: sameFilter ? result.options : [], loading,
    error: !loading ? result?.error || '' : '', hasMore: sameFilter ? result.hasMore : false,
    loadMore: () => {
      if (loading) return;
      // A failed page is retried, never skipped by advancing the page number.
      if (result?.error) setAttempt(value => value + 1);
      else setPage(value => value + 1);
    },
  };
}
