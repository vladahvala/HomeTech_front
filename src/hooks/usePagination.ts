import { useCallback, useMemo, useState } from 'react';

export function usePagination<T>(items: T[], perPage: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const [requestedPage, setRequestedPage] = useState(1);
  const page = Math.min(Math.max(1, requestedPage), totalPages);

  const pageItems = useMemo(
    () => items.slice((page - 1) * perPage, page * perPage),
    [items, page, perPage],
  );

  const goToPage = useCallback(
    (target: number) => setRequestedPage(Math.min(Math.max(1, target), totalPages)),
    [totalPages],
  );

  return { page, totalPages, pageItems, goToPage };
}