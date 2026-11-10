import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import type { ProductQuery } from '../types';
import { parseQuery, toSearchParams } from '../utils/catalogQuery';

/**
 * Фільтри, сортування й сторінка живуть в адресі (?page=2&sort=…),
 * тож посилання на сторінку відновлює той самий список (UC-CAT-02).
 */
export function useCatalogQuery(category?: string) {
  const location = useLocation();
  const navigate = useNavigate();

  const query = useMemo(() => parseQuery(location.search, category), [location.search, category]);

  const setQuery = useCallback(
    (next: ProductQuery) => {
      const params = toSearchParams(next).toString();
      // keepScroll: при зміні фільтра чи порядку сторінка не стрибає вгору
      navigate(`${location.pathname}${params ? `?${params}` : ''}`, { state: { keepScroll: true } });
    },
    [location.pathname, navigate],
  );

  /** Змінює фільтри й повертає на першу сторінку */
  const updateFilters = useCallback(
    (changes: Partial<ProductQuery>) => setQuery({ ...query, ...changes, page: 1 }),
    [query, setQuery],
  );

  return { query, setQuery, updateFilters };
}
