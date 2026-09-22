'use client';

import { useEffect, useState } from 'react';

export function useGrowerProductOptions<T extends { id: string }>(search: string, view = 'all') {
  const [options, setOptions] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => { setQuery(search); setPage(1); }, 250);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    if (page === 1) setOptions([]);
    fetch(`/api/products?${new URLSearchParams({ search: query, view, page: String(page), pageSize: '25' })}`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Could not load products. Try again.');
        const data = await response.json();
        if (!controller.signal.aborted) {
          setOptions(previous => page === 1 ? data.products : [...new Map([...previous, ...data.products].map(product => [product.id, product])).values()] as T[]);
          setHasMore(data.page * data.pageSize < data.total);
        }
      }).catch(error => { if (!controller.signal.aborted) setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, page, view]);
  return { options, loading, error, hasMore, loadMore: () => setPage(value => value + 1) };
}
