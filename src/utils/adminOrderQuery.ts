import type { AdminOrderQuery, OrderStatus } from '../types';

// Фільтри списку замовлень ↔ рядок адреси (?status=new&status=processing&from=…&page=2).
// Ті самі назви параметрів надсилаємо бекенду.

const STATUSES: OrderStatus[] = ['new', 'processing', 'assembled', 'shipped', 'delivered', 'cancelled'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseAdminOrderQuery(search: string): AdminOrderQuery {
  const params = new URLSearchParams(search);
  const page = Number(params.get('page'));
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';

  return {
    statuses: params.getAll('status').filter((value): value is OrderStatus =>
      STATUSES.includes(value as OrderStatus),
    ),
    dateFrom: DATE.test(from) ? from : undefined,
    dateTo: DATE.test(to) ? to : undefined,
    customer: params.get('customer')?.trim() || undefined,
    number: params.get('number')?.trim() || undefined,
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

export function toAdminOrderParams(query: AdminOrderQuery): URLSearchParams {
  const params = new URLSearchParams();
  for (const status of query.statuses) params.append('status', status);
  if (query.dateFrom) params.set('from', query.dateFrom);
  if (query.dateTo) params.set('to', query.dateTo);
  if (query.customer) params.set('customer', query.customer);
  if (query.number) params.set('number', query.number);
  if (query.page > 1) params.set('page', String(query.page));
  return params;
}
