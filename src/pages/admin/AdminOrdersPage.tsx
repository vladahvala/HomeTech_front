import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { adminOrderService } from '../../api';
import AccountLayout from '../../components/AccountLayout';
import ListState from '../../components/ListState';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import Pager from '../../components/Pager';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import type { AdminOrderQuery, OrderStatus } from '../../types';
import { parseAdminOrderQuery, toAdminOrderParams } from '../../utils/adminOrderQuery';
import { formatDateTime } from '../../utils/dates';
import { formatPrice } from '../../utils/format';
import { DELIVERY_LABELS, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '../../utils/labels';

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

/** Замовлення магазину з фільтрами (UC-ADM-ORD-01) */
export default function AdminOrdersPage() {
  useDocumentTitle('Замовлення магазину');
  const location = useLocation();
  const navigate = useNavigate();
  const query = parseAdminOrderQuery(location.search);
  const queryKey = toAdminOrderParams(query).toString();

  const { data, error, isLoading, reload } = useAsync(() => adminOrderService.listOrders(query), [queryKey]);
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  const applyQuery = (next: AdminOrderQuery) => {
    const params = toAdminOrderParams(next).toString();
    navigate(`/admin/orders${params ? `?${params}` : ''}`, { state: { keepScroll: true } });
  };

  const hasFilters =
    query.statuses.length > 0 || !!query.dateFrom || !!query.dateTo || !!query.customer || !!query.number;

  let content: ReactNode;
  if (error) content = <ListState kind="error" error={error} onRetry={reload} />;
  else if (!data) content = <ListState kind="loading" text="Завантажуємо замовлення…" />;
  else if (data.items.length === 0) {
    content = (
      <ListState
        kind="empty"
        text={hasFilters ? 'Немає замовлень за цими фільтрами.' : 'Замовлень ще немає.'}
      >
        {hasFilters && (
          <button type="button" className="cart-button list-state__retry" onClick={() => applyQuery({ statuses: [], page: 1 })}>
            Скинути фільтри
          </button>
        )}
      </ListState>
    );
  } else {
    content = (
      <>
        <p className="admin-orders__count" aria-live="polite">
          Знайдено: {data.total}
        </p>
        <table className={`orders-table admin-orders__table${isLoading ? ' orders-table--loading' : ''}`}>
          <thead>
            <tr>
              <th scope="col">Номер</th>
              <th scope="col">Дата</th>
              <th scope="col">Клієнт</th>
              <th scope="col">Доставка</th>
              <th scope="col">Сума</th>
              <th scope="col">Оплата</th>
              <th scope="col">Статус</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((order) => (
              <tr key={order.number}>
                <td data-label="Номер">
                  <Link className="orders-table__number" to={`/admin/orders/${order.number}`}>
                    {order.number}
                  </Link>
                </td>
                <td data-label="Дата">{formatDateTime(order.createdAt)}</td>
                <td data-label="Клієнт">
                  <span className="admin-orders__customer">{order.customer.fullName}</span>
                  <span className="admin-orders__phone">{order.customer.phone}</span>
                </td>
                <td data-label="Доставка">{DELIVERY_LABELS[order.delivery]}</td>
                <td data-label="Сума">
                  {formatPrice(order.total)}
                  <span className="admin-orders__qty"> · {order.itemsCount} шт.</span>
                </td>
                <td data-label="Оплата">
                  <span className={`payment-status payment-status--${order.paymentStatus}`}>
                    {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                  </span>
                </td>
                <td data-label="Статус">
                  <OrderStatusBadge status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pager
          currentPage={query.page}
          totalPages={totalPages}
          hrefFor={(page) => {
            const params = toAdminOrderParams({ ...query, page }).toString();
            return `/admin/orders${params ? `?${params}` : ''}`;
          }}
        />
      </>
    );
  }

  return (
    <AccountLayout title="Замовлення магазину">
      <OrderFilters query={query} onApply={applyQuery} />
      {content}
    </AccountLayout>
  );
}

interface OrderFiltersProps {
  query: AdminOrderQuery;
  onApply: (query: AdminOrderQuery) => void;
}

/** Фільтри: статуси (одразу), період, клієнт, номер (кнопкою «Знайти») */
function OrderFilters({ query, onApply }: OrderFiltersProps) {
  const [dateFrom, setDateFrom] = useState(query.dateFrom ?? '');
  const [dateTo, setDateTo] = useState(query.dateTo ?? '');
  const [customer, setCustomer] = useState(query.customer ?? '');
  const [number, setNumber] = useState(query.number ?? '');
  const [error, setError] = useState('');

  // посилання «Назад» або «Скинути» змінили адресу — оновлюємо поля
  useEffect(() => {
    setDateFrom(query.dateFrom ?? '');
    setDateTo(query.dateTo ?? '');
    setCustomer(query.customer ?? '');
    setNumber(query.number ?? '');
  }, [query.dateFrom, query.dateTo, query.customer, query.number]);

  const toggleStatus = (status: OrderStatus) => {
    const statuses = query.statuses.includes(status)
      ? query.statuses.filter((item) => item !== status)
      : [...query.statuses, status];
    onApply({ ...query, statuses, page: 1 });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setError('Початок періоду пізніше за кінець. Поміняйте дати місцями.');
      return;
    }
    setError('');
    onApply({
      statuses: query.statuses,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      customer: customer.trim() || undefined,
      number: number.trim() || undefined,
      page: 1,
    });
  };

  return (
    <form className="admin-filters" onSubmit={handleSubmit} noValidate>
      <fieldset className="admin-filters__statuses">
        <legend className="admin-filters__legend">Статус</legend>
        {STATUSES.map((status) => (
          <label key={status} className="admin-filters__chip">
            <input
              type="checkbox"
              checked={query.statuses.includes(status)}
              onChange={() => toggleStatus(status)}
            />
            {ORDER_STATUS_LABELS[status]}
          </label>
        ))}
      </fieldset>

      <div className="admin-filters__fields">
        <label className="admin-filters__field">
          <span>Оформлено з</span>
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        </label>
        <label className="admin-filters__field">
          <span>по</span>
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </label>
        <label className="admin-filters__field admin-filters__field--wide">
          <span>Клієнт</span>
          <input
            type="search"
            placeholder="ПІБ, email або телефон"
            value={customer}
            onChange={(event) => setCustomer(event.target.value)}
          />
        </label>
        <label className="admin-filters__field">
          <span>Номер</span>
          <input
            type="search"
            placeholder="DT-000001"
            value={number}
            onChange={(event) => setNumber(event.target.value)}
          />
        </label>
        <div className="admin-filters__actions">
          <button type="submit" className="cart-button">
            Знайти
          </button>
          <button type="button" className="link-button" onClick={() => onApply({ statuses: [], page: 1 })}>
            Скинути
          </button>
        </div>
      </div>
      {error && (
        <p className="form-field__error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
