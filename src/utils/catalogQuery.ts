import type { ProductQuery, SortOrder } from '../types';

// Параметри списку товарів ↔ рядок адреси (?page=2&sort=price_asc&m=3&m=5&c301=1.7).
// Ті самі назви параметрів надсилаємо бекенду, тож збережене посилання
// відновлює ті самі фільтри й порядок (UC-CAT-02).

const SORTS: SortOrder[] = ['default', 'price_asc', 'price_desc', 'newest'];
const CHARACTERISTIC_PREFIX = 'c';

export function emptyQuery(category?: string): ProductQuery {
  return {
    category,
    page: 1,
    sort: 'default',
    manufacturers: [],
    inStockOnly: false,
    characteristics: {},
  };
}

function toPositiveNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

/** Розбирає рядок адреси; некоректні значення просто ігноруються */
export function parseQuery(search: string, category?: string): ProductQuery {
  const params = new URLSearchParams(search);
  const query = emptyQuery(category);

  const page = Number(params.get('page'));
  if (Number.isInteger(page) && page > 1) query.page = page;

  const sort = params.get('sort') as SortOrder | null;
  if (sort && SORTS.includes(sort)) query.sort = sort;

  const searchText = params.get('q')?.trim();
  if (searchText) query.search = searchText;

  query.manufacturers = params
    .getAll('m')
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);

  query.priceMin = toPositiveNumber(params.get('pmin'));
  query.priceMax = toPositiveNumber(params.get('pmax'));
  query.inStockOnly = params.get('stock') === '1';
  if (params.get('promo') === '1') query.promoOnly = true;

  for (const key of new Set(params.keys())) {
    const id = Number(key.slice(CHARACTERISTIC_PREFIX.length));
    if (key.startsWith(CHARACTERISTIC_PREFIX) && Number.isInteger(id) && id > 0) {
      query.characteristics[id] = params.getAll(key).filter(Boolean);
    }
  }

  return query;
}

/** Будує рядок параметрів; значення за замовчуванням не пишемо, щоб адреса була короткою */
export function toSearchParams(query: ProductQuery, includeCategory = false): URLSearchParams {
  const params = new URLSearchParams();

  if (includeCategory && query.category) params.set('category', query.category);
  if (query.search) params.set('q', query.search);
  if (query.page > 1) params.set('page', String(query.page));
  if (query.sort !== 'default') params.set('sort', query.sort);
  for (const id of query.manufacturers) params.append('m', String(id));
  if (query.priceMin !== undefined) params.set('pmin', String(query.priceMin));
  if (query.priceMax !== undefined) params.set('pmax', String(query.priceMax));
  if (query.inStockOnly) params.set('stock', '1');
  if (query.promoOnly) params.set('promo', '1');

  for (const [id, values] of Object.entries(query.characteristics)) {
    for (const value of values) params.append(`${CHARACTERISTIC_PREFIX}${id}`, value);
  }

  return params;
}

/** Чи задано хоч один фільтр (для кнопки «Скинути») */
export function hasActiveFilters(query: ProductQuery): boolean {
  return (
    query.manufacturers.length > 0 ||
    query.priceMin !== undefined ||
    query.priceMax !== undefined ||
    query.inStockOnly ||
    !!query.promoOnly ||
    Object.values(query.characteristics).some((values) => values.length > 0)
  );
}
