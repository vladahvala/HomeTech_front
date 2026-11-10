import type { AdminClientQuery } from '../types';

// Пошук клієнтів ↔ рядок адреси (?search=…&status=deleted&page=2); ті самі параметри — для бекенду

export function parseAdminClientQuery(search: string): AdminClientQuery {
  const params = new URLSearchParams(search);
  const page = Number(params.get('page'));
  return {
    search: params.get('search')?.trim() || undefined,
    status: params.get('status') === 'deleted' ? 'deleted' : 'active',
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

export function toAdminClientParams(query: AdminClientQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.status === 'deleted') params.set('status', 'deleted');
  if (query.page > 1) params.set('page', String(query.page));
  return params;
}
