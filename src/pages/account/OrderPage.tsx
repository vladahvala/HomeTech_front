import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useParams } from 'react-router';
import { orderService } from '../../api';
import { ApiError, getErrorMessage } from '../../api/ApiError';
import AccountLayout from '../../components/AccountLayout';
import ListState from '../../components/ListState';
import Notice from '../../components/Notice';
import OrderHistory from '../../components/OrderHistory';
import { describeDelivery } from '../../components/OrderSummary';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import type { Order } from '../../types';
import { formatDateTime } from '../../utils/dates';
import { formatPrice } from '../../utils/format';
import {
  canClientCancel,
  ORDER_STATUS_LABELS,
  PAYMENT_LABELS,
  PAYMENT_STATUS_LABELS,
} from '../../utils/labels';
import { CANCEL_REASON_MAX, validateCancelReason } from '../../validation/rules';
import NotFoundPage from '../NotFoundPage';

/** Перегляд свого замовлення (UC-ORD-03) і скасування (UC-ORD-04) */
export default function OrderPage() {
  const number = useParams().number ?? '';
  useDocumentTitle(`Замовлення ${number}`);
  const { data, error, isLoading, reload } = useAsync(() => orderService.getMyOrder(number), [number]);
  // після скасування показуємо оновлене замовлення без нового запиту
  const [updated, setUpdated] = useState<Order | null>(null);
  const order = updated?.number === number ? updated : data;

  // чуже й неіснуюче замовлення виглядають однаково (SEC-05)
  if (error instanceof ApiError && error.status === 404) {
    return <NotFoundPage message="Замовлення не знайдено" />;
  }

  let content: ReactNode;
  if (error) content = <ListState kind="error" error={error} onRetry={reload} />;
  else if (isLoading || !order || order.number !== number) content = <ListState kind="loading" />;
  else content = <OrderDetails order={order} onChanged={setUpdated} onReload={reload} />;

  return (
    <AccountLayout
      title={`Замовлення ${number}`}
      crumbs={[{ label: 'Мої замовлення', to: '/account/orders' }, { label: number }]}
    >
      {content}
    </AccountLayout>
  );
}

interface OrderDetailsProps {
  order: Order;
  onChanged: (order: Order) => void;
  onReload: () => void;
}

function OrderDetails({ order, onChanged, onReload }: OrderDetailsProps) {
  const [justCancelled, setJustCancelled] = useState(false);

  return (
    <div className="order-view">
      {justCancelled && <Notice kind="success">Замовлення скасовано.</Notice>}

      <div className="order-view__header">
        <OrderStatusBadge status={order.status} />
        <span className="order-view__date">Оформлено {formatDateTime(order.createdAt)}</span>
      </div>

      <table className="order-items">
        <thead>
          <tr>
            <th scope="col">Товар</th>
            <th scope="col">Ціна</th>
            <th scope="col">Кількість</th>
            <th scope="col">Сума</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.productId}>
              <td data-label="Товар">{item.name}</td>
              <td data-label="Ціна">{formatPrice(item.price)}</td>
              <td data-label="Кількість">{item.quantity}</td>
              <td data-label="Сума">{formatPrice(item.price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={3}>
              Разом
            </th>
            <td className="order-items__total">{formatPrice(order.total)}</td>
          </tr>
        </tfoot>
      </table>

      <dl className="specs order-view__facts">
        <div className="specs__row">
          <dt className="specs__name">Доставка</dt>
          <dd className="specs__value">{describeDelivery(order.delivery)}</dd>
        </div>
        <div className="specs__row">
          <dt className="specs__name">Оплата</dt>
          <dd className="specs__value">
            {PAYMENT_LABELS[order.payment]} · {PAYMENT_STATUS_LABELS[order.paymentStatus]}
          </dd>
        </div>
        <div className="specs__row">
          <dt className="specs__name">Отримувач</dt>
          <dd className="specs__value">
            {order.recipient.fullName}, {order.recipient.phone}
          </dd>
        </div>
        {order.comment && (
          <div className="specs__row">
            <dt className="specs__name">Коментар</dt>
            <dd className="specs__value">{order.comment}</dd>
          </div>
        )}
      </dl>

      <section className="order-view__section">
        <h3 className="order-view__subtitle">Історія статусів</h3>
        <OrderHistory history={order.history} />
      </section>

      <CancelSection
        order={order}
        onCancelled={(cancelled) => {
          setJustCancelled(true);
          onChanged(cancelled);
        }}
        onReload={onReload}
      />
    </div>
  );
}

interface CancelSectionProps {
  order: Order;
  onCancelled: (order: Order) => void;
  onReload: () => void;
}

/** Скасування з підтвердженням і необов'язковою причиною (UC-ORD-04) */
function CancelSection({ order, onCancelled, onReload }: CancelSectionProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (order.status === 'cancelled' || order.status === 'delivered') return null;

  if (!canClientCancel(order.status)) {
    return (
      <p className="order-view__cancel-note">
        Замовлення в статусі «{ORDER_STATUS_LABELS[order.status]}» скасовує магазин — зателефонуйте
        менеджеру.
      </p>
    );
  }

  if (!isConfirming) {
    return (
      <button type="button" className="order-view__cancel" onClick={() => setIsConfirming(true)}>
        Скасувати замовлення
      </button>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reasonError = validateCancelReason(reason);
    if (reasonError) {
      setError(reasonError);
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      onCancelled(await orderService.cancelMyOrder(order.number, reason.trim()));
    } catch (failure) {
      setIsSubmitting(false);
      setError(getErrorMessage(failure));
      // REL-03: статус змінив магазин — показуємо актуальний стан
      if (failure instanceof ApiError && failure.code === 'STATUS_CHANGED') onReload();
    }
  };

  return (
    <form className="cancel-form" onSubmit={handleSubmit} noValidate>
      <p className="cancel-form__question">Скасувати замовлення {order.number}?</p>
      <label className="form-field__label" htmlFor="cancel-reason">
        Причина (необов’язково)
      </label>
      <textarea
        id="cancel-reason"
        className={`form-field__input${error ? ' form-field__input--invalid' : ''}`}
        rows={3}
        value={reason}
        aria-invalid={error ? true : undefined}
        aria-describedby="cancel-reason-counter"
        onChange={(event) => {
          setReason(event.target.value);
          setError('');
        }}
      />
      <p
        id="cancel-reason-counter"
        className={`form-field__hint${reason.length > CANCEL_REASON_MAX ? ' form-field__hint--over' : ''}`}
      >
        {reason.length} / {CANCEL_REASON_MAX}
      </p>
      {error && (
        <p className="form-field__error" role="alert">
          {error}
        </p>
      )}
      <div className="cancel-form__actions">
        <button type="submit" className="cancel-form__confirm" disabled={isSubmitting}>
          {isSubmitting ? 'Скасовуємо…' : 'Так, скасувати'}
        </button>
        <button
          type="button"
          className="link-button"
          disabled={isSubmitting}
          onClick={() => {
            setIsConfirming(false);
            setError('');
          }}
        >
          Ні, залишити
        </button>
      </div>
    </form>
  );
}
