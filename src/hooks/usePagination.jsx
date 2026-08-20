import { useEffect, useMemo, useState } from 'react';

export const DEFAULT_PAGE_SIZE = 10;

/**
 * Client-side pagination over an already-filtered array.
 * Slices `items` into pages and resets to page 1 whenever the underlying
 * list changes identity (e.g. a new search term produced a new filtered array).
 */
export function usePagination(items, { pageSize: initialPageSize = DEFAULT_PAGE_SIZE } = {}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Reset in an effect — never setState during render, or an unstable
  // `items` reference (e.g. `data ?? []`) will infinite-loop.
  useEffect(() => {
    setPage(1);
  }, [items]);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page_ = Math.min(page, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (page_ - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page_, pageSize]);

  const goToPage = (nextPage) => setPage(Math.min(Math.max(1, nextPage), totalPages));

  return {
    page: page_,
    pageSize,
    totalItems,
    totalPages,
    paginatedItems,
    goToPage,
    setPageSize: (size) => {
      setPageSize(size);
      setPage(1);
    },
  };
}
