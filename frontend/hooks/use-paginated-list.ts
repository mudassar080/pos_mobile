import { useEffect, useMemo, useRef, useState } from 'react';
import { useDebouncedValue } from './use-debounced-value';
import { DEFAULT_PAGE_SIZE, emptyPagination, type PaginationMeta } from '@/lib/pagination';

type PaginatedResponse<T> = {
  success: boolean;
  data?: T[];
  pagination?: PaginationMeta;
};

type UsePaginatedListOptions = {
  pageSize?: number;
  sortOrder?: string;
  sortBy?: string;
  extraParams?: Record<string, string>;
  enabled?: boolean;
  searchDebounceMs?: number;
};

export function usePaginatedList<T = unknown>(
  fetchFn: (params: Record<string, string>) => Promise<PaginatedResponse<T>>,
  options: UsePaginatedListOptions = {}
) {
  const {
    pageSize: initialPageSize = DEFAULT_PAGE_SIZE,
    sortOrder = 'desc',
    sortBy,
    extraParams,
    enabled = true,
    searchDebounceMs = 400,
  } = options;

  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const extraKey = useMemo(
    () => JSON.stringify(extraParams ?? {}),
    [extraParams]
  );

  const stableExtraParams = useMemo(
    () => ({ ...(extraParams ?? {}) }),
    [extraKey]
  );

  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, searchDebounceMs);
  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(() =>
    emptyPagination(initialPageSize)
  );
  const [loading, setLoading] = useState(true);
  const [refetchToken, setRefetchToken] = useState(0);

  const prevFiltersRef = useRef({ debouncedSearch, extraKey });

  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (prev.debouncedSearch !== debouncedSearch || prev.extraKey !== extraKey) {
      prevFiltersRef.current = { debouncedSearch, extraKey };
      setPage(1);
    }
  }, [debouncedSearch, extraKey]);

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setPage(1);
  };

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {
          page: String(page),
          limit: String(pageSize),
          sortOrder,
          ...stableExtraParams,
        };
        if (sortBy) params.sortBy = sortBy;
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

        const response = await fetchFnRef.current(params);
        if (!cancelled && response.success) {
          setItems(response.data || []);
          setPagination(response.pagination || emptyPagination(pageSize));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, extraKey, enabled, pageSize, sortOrder, sortBy, refetchToken]);

  const refetch = () => {
    setRefetchToken((token) => token + 1);
  };

  return {
    items,
    loading,
    page,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    search,
    setSearch,
    refetch,
  };
}
