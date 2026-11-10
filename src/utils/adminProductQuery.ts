import type { AdminProductQuery, Availability, ProductSource } from '../types';

// Фільтри списку товарів ↔ рядок адреси (?search=…&category=none&published=false&page=2).
// Ті самі назви параметрів надсилаємо бекенду.

const AVAILABILITY: Availability[] = ['in_stock', 'expected', 'out_of_stock'];
const SOURCES: ProductSource[] = ['katran', 'manual'];

function positiveInt(value: string | null): number | undefined {
  const number = Number(value);
  return value && Number.isInteger(number) && number > 0 ? number : undefined;
}

export function parseAdminProductQuery(search: string): AdminProductQuery {
  const params = new URLSearchParams(search);
  const category = params.get('category');
  const published = params.get('published');
  const availability = params.get('availability') as Availability | null;
  const source = params.get('source') as ProductSource | null;

  return {
    search: params.get('search')?.trim() || undefined,
    category: category === 'none' ? 'none' : positiveInt(category),
    manufacturer: positiveInt(params.get('manufacturer')),
    published: published === 'true' ? true : published === 'false' ? false : undefined,
    availability: availability && AVAILABILITY.includes(availability) ? availability : undefined,
    source: source && SOURCES.includes(source) ? source : undefined,
    page: positiveInt(params.get('page')) ?? 1,
  };
}

export function toAdminProductParams(query: AdminProductQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.category !== undefined) params.set('category', String(query.category));
  if (query.manufacturer !== undefined) params.set('manufacturer', String(query.manufacturer));
  if (query.published !== undefined) params.set('published', String(query.published));
  if (query.availability) params.set('availability', query.availability);
  if (query.source) params.set('source', query.source);
  if (query.page > 1) params.set('page', String(query.page));
  return params;
}
