import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { orderService } from '../../api';
import AccountLayout from '../../components/AccountLayout';
import ListState from '../../components/ListState';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import Pager from '../../components/Pager';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatDateTime } from '../../utils/dates';
import { formatPrice } from '../../utils/format';

/** Архів замовлень Клієнта: від нових до старих, по 20 (UC-ORD-02) */
export default function OrdersPage() {
  useDocumentTitle('Мої замовлення');
  const location = useLocation();
  const pageParam = Number(new URLSearchParams(location.search).get('page'));
  const page = Number.isInteger(pageParam) && pageParam > 1 ? pageParam : 1;

  const { data, error, isLoading, reload } = useAsync(() => orderService.listMyOrders(page), [page]);
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  let content: ReactNode;
  if (error) content = <ListState kind="error" error={error} onRetry={reload} />;
  else if (!data) content = <ListState kind="loading" text="Завантажуємо замовлення…" />;
  else if (data.total === 0) {
    content = (
      <ListState kind="empty" text="У вас ще немає замовлень.">
        <Link className="cart-button list-state__retry" to="/#catalog">
          До каталогу
        </Link>
      </ListState>
    );
  } else if (data.items.length === 0) {
    content = (
      <ListState kind="empty" text="На цій сторінці замовлень немає.">
        <Link className="cart-button list-state__retry" to="/account/orders">
          До першої сторінки
        </Link>
      </ListState>
    );
  } else {
    content = (
      <>
        <table className={`orders-table${isLoading ? ' orders-table--loading' : ''}`}>
          <thead>
            <tr>
              <th scope="col">Номер</th>
              <th scope="col">Дата</th>
              <th scope="col">Товарів</th>
              <th scope="col">Сума</th>
              <th scope="col">Статус</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((order) => (
              <tr key={order.number}>
                <td data-label="Номер">
                  <Link className="orders-table__number" to={`/account/orders/${order.number}`}>
                    {order.number}
                  </Link>
                </td>
                <td data-label="Дата">{formatDateTime(order.createdAt)}</td>
                <td data-label="Товарів">{order.itemsCount} шт.</td>
                <td data-label="Сума">{formatPrice(order.total)}</td>
                <td data-label="Статус">
                  <OrderStatusBadge status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pager
          currentPage={page}
          totalPages={totalPages}
          hrefFor={(number) => (number > 1 ? `/account/orders?page=${number}` : '/account/orders')}
        />
      </>
    );
  }

  return <AccountLayout title="Мої замовлення">{content}</AccountLayout>;
}
