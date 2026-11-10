import { Link, useLocation } from 'react-router';
import Notice from '../components/Notice';
import OrderSummary from '../components/OrderSummary';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import type { Order } from '../types';
import { formatDateTime } from '../utils/dates';
import { ORDER_STATUS_LABELS } from '../utils/labels';

/** Крок 14 UC-ORD-01: номер замовлення й перехід до його перегляду */
export default function OrderSuccessPage() {
  useDocumentTitle('Замовлення оформлено');
  const order = (useLocation().state as { order?: Order } | null)?.order;

  // сторінку оновили — даних замовлення в переході вже немає
  if (!order) {
    return (
      <main className="checkout-page">
        <Notice kind="success" title="Замовлення оформлено">
          Номер і деталі замовлення — в особистому кабінеті.{' '}
          <Link to="/account">Перейти до кабінету</Link>
        </Notice>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <Notice kind="success" title={`Замовлення ${order.number} оформлено`}>
        <p>
          Статус: <strong>{ORDER_STATUS_LABELS[order.status]}</strong>. Оформлено{' '}
          {formatDateTime(order.createdAt)}. Менеджер зв’яжеться з вами за номером{' '}
          {order.recipient.phone}.
        </p>
        <div className="notice__actions">
          <Link className="cart-button" to="/account">
            Мої замовлення
          </Link>
          <Link className="notice__link" to="/#catalog">
            Продовжити покупки
          </Link>
        </div>
      </Notice>

      <div className="checkout-page__summary">
        <OrderSummary
          lines={order.items.map((item) => ({
            key: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          }))}
          total={order.total}
          delivery={order.delivery}
          payment={order.payment}
        />
        {order.comment && <p className="checkout-page__comment">Коментар: {order.comment}</p>}
      </div>
    </main>
  );
}
