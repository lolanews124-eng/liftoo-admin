import { useCallback, useEffect, useState } from 'react';
import type { Paginated } from '../api/client';

export function usePaginatedList<T>(
  fetcher: (params: Record<string, string>) => Promise<Paginated<T>>,
  filters: Record<string, string> = {},
  limit = 20,
) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit), ...filters };
      Object.keys(params).forEach((k) => {
        if (!params[k]) delete params[k];
      });
      const r = await fetcher(params);
      setItems(r.items ?? []);
      setTotal(r.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [fetcher, filters, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  const resetPage = () => setPage(1);

  return { items, total, page, setPage, loading, error, reload: load, limit, resetPage };
}
