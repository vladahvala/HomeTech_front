import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useParams } from 'react-router';
import { adminOrderService } from '../../api';
import { ApiError, getErrorMessage } from '../../api/ApiError';
import AccountLayout from '../../components/AccountLayout';
import ListState from '../../components/ListState';
import Notice from '../../components/Notice';
import OrderHistory from '../../components/OrderHistory';
import { describeDelivery } from '../../components/OrderSummary';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import type { AdminOrder, OrderStatus, PaymentStatus } from '../../types';
import { formatDateTime } from '../../utils/dates';
import { formatPrice } from '../../utils/format';
import { ORDER_STATUS_LABELS, PAYMENT_LABELS, PAYMENT_STATUS_LABELS } from '../../utils/labels';
import {
  INTERNAL_NOTE_MAX,
  STATUS_NOTE_MAX,
  validateInternalNote,
  validateStatusNote,
} from '../../validation/rules';
import NotFoundPage from '../NotFoundPage';

/** Замовлення в адмінці (UC-ADM-ORD-01…03) */
export default function AdminOrderPage() {
  const number = useParams().number ?? '';
  useDocumentTitle(`Замовлення ${number}`);
  const { data, error, isLoading, reload } = useAsync(() => adminOrderService.getOrder(number), [number]);
  // після зміни показуємо відповідь сервера одразу, без нового запиту
  const [updated, setUpdated] = useState<AdminOrder | null>(null);
  const [flash, setFlash] = useState('');
  // А2, А3: чому зміну відхилено — показуємо над панелями, бо панель після оновлення перестворюється
  const [conflict, setConflict] = useState('');
  const order = updated && updated.number === number ? updated : data;

  if (error instanceof ApiError && error.status === 404) {
    return <NotFoundPage message="Замовлення не знайдено" />;
  }

  // після перезавантаження (А2, А3) свіжі дані з сервера важливіші за попередню відповідь
  const handleConflict = (reason: string) => {
    setUpdated(null);
    setFlash('');
    setConflict(reason);
    reload();
  };

  const handleStatusChanged = (saved: AdminOrder) => {
    setUpdated(saved);
    setConflict('');
    setFlash(`Статус змінено: «${ORDER_STATUS_LABELS[saved.status]}». Клієнт уже бачить його в кабінеті.`);
  };

  let content: ReactNode;
  if (error) content = <ListState kind="error" error={error} onRetry={reload} />;
  else if (!order || order.number !== number) content = <ListState kind="loading" />;
  else {
    content = (
      <div className={`admin-order${isLoading ? ' admin-order--loading' : ''}`}>
        <OrderDetails order={order} />
        <aside className="admin-order__aside">
          {/* key: після кожної зміни статусу панель починає з чистої форми */}
          {flash && <Notice kind="success">{flash}</Notice>}
          {conflict && <Notice kind="error">{conflict}</Notice>}
          <StatusPanel
            key={`${order.status}-${order.history.length}`}
            order={order}
            onChanged={handleStatusChanged}
            onConflict={handleConflict}
          />
          <PaymentPanel key={`pay-${order.number}`} order={order} onChanged={setUpdated} />
        </aside>
      </div>
    );
  }

  return (
    <AccountLayout
      title={`Замовлення ${number}`}
      crumbs={[{ label: 'Замовлення', to: '/admin/orders' }, { label: number }]}
    >
      {content}
    </AccountLayout>
  );
}

function OrderDetails({ order }: { order: AdminOrder }) {
  return (
    <div className="admin-order__main">
      <div className="order-view__header">
        <OrderStatusBadge status={order.status} />
        <span className={`payment-status payment-status--${order.paymentStatus}`}>
          {PAYMENT_STATUS_LABELS[order.paymentStatus]}
        </span>
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
          <dt className="specs__name">Клієнт</dt>
          <dd className="specs__value">
            {order.customer.fullName}, {order.customer.phone}, {order.customer.email}
          </dd>
        </div>
        <div className="specs__row">
          <dt className="specs__name">Отримувач</dt>
          <dd className="specs__value">
            {order.recipient.fullName}, {order.recipient.phone}
          </dd>
        </div>
        <div className="specs__row">
          <dt className="specs__name">Доставка</dt>
          <dd className="specs__value">{describeDelivery(order.delivery)}</dd>
        </div>
        <div className="specs__row">
          <dt className="specs__name">Оплата</dt>
          <dd className="specs__value">{PAYMENT_LABELS[order.payment]}</dd>
        </div>
        {order.comment && (
          <div className="specs__row">
            <dt className="specs__name">Коментар клієнта</dt>
            <dd className="specs__value">{order.comment}</dd>
          </div>
        )}
      </dl>

      <section className="order-view__section">
        <h3 className="order-view__subtitle">Історія статусів</h3>
        <OrderHistory history={order.history} showPerformer />
      </section>
    </div>
  );
}

interface StatusPanelProps {
  order: AdminOrder;
  onChanged: (order: AdminOrder) => void;
  /** Зміну відхилено, бо стан застарів: показати причину й оновити замовлення */
  onConflict: (reason: string) => void;
}

/** Зміна статусу (UC-ADM-ORD-02) */
function StatusPanel({ order, onChanged, onConflict }: StatusPanelProps) {
  const [target, setTarget] = useState<OrderStatus | null>(null);
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isCancel = target === 'cancelled';

  // А4: кінцевий статус — переходів немає
  if (order.allowedTransitions.length === 0) {
    return (
      <section className="admin-panel">
        <h3 className="admin-panel__title">Статус</h3>
        <p className="admin-panel__text">
          «{ORDER_STATUS_LABELS[order.status]}» — кінцевий статус, далі змінювати нічого.
        </p>
      </section>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    if (!target) {
      setError('Оберіть новий статус.');
      return;
    }
    const noteError = validateStatusNote(note, isCancel);
    if (noteError) {
      setError(noteError);
      return;
    }
    // А1: скасування — з додатковим підтвердженням
    if (isCancel && !confirmed) {
      setError('Підтвердьте скасування позначкою нижче.');
      return;
    }

    setError('');
    setIsSaving(true);
    try {
      const saved = await adminOrderService.changeStatus(order.number, {
        expectedStatus: order.status,
        status: target,
        note: note.trim(),
      });
      onChanged(saved);
    } catch (failure) {
      setIsSaving(false);
      if (failure instanceof ApiError && failure.code === 'VALIDATION_ERROR') {
        setError(failure.fields.note ?? failure.message);
        return;
      }
      // А2, А3: статус змінили або перехід заборонено — показуємо актуальний стан
      if (failure instanceof ApiError && (failure.code === 'STATUS_CHANGED' || failure.code === 'TRANSITION_NOT_ALLOWED')) {
        onConflict(failure.message);
        return;
      }
      // А5: збій — статус лишився попереднім
      setMessage({ kind: 'error', text: `${getErrorMessage(failure)} Статус лишився попереднім.` });
    }
  };

  return (
    <form className="admin-panel" onSubmit={handleSubmit} noValidate>
      <h3 className="admin-panel__title">Змінити статус</h3>
      {message && <Notice kind={message.kind}>{message.text}</Notice>}

      <fieldset className="admin-panel__fieldset">
        <legend className="admin-panel__label">
          Зараз: <OrderStatusBadge status={order.status} />. Новий статус:
        </legend>
        <div className="choice-group">
          {order.allowedTransitions.map((status) => (
            <label key={status} className="choice-group__option">
              <input
                type="radio"
                name="status"
                value={status}
                checked={target === status}
                onChange={() => {
                  setTarget(status);
                  setError('');
                  setConfirmed(false);
                }}
              />
              {ORDER_STATUS_LABELS[status]}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="form-field__label" htmlFor="status-note">
        {isCancel ? 'Причина скасування (обов’язково)' : 'Примітка (необов’язково)'}
      </label>
      <textarea
        id="status-note"
        className={`form-field__input${error ? ' form-field__input--invalid' : ''}`}
        rows={3}
        value={note}
        placeholder={target === 'shipped' ? 'Наприклад: ТТН 20450000123456' : 'Клієнт побачить цю примітку'}
        aria-describedby="status-note-counter"
        onChange={(event) => {
          setNote(event.target.value);
          setError('');
        }}
      />
      <p
        id="status-note-counter"
        className={`form-field__hint${note.length > STATUS_NOTE_MAX ? ' form-field__hint--over' : ''}`}
      >
        {note.length} / {STATUS_NOTE_MAX} · примітку побачить клієнт
      </p>

      {isCancel && (
        <label className="admin-panel__confirm">
          <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
          Так, скасувати замовлення {order.number}
        </label>
      )}

      {error && (
        <p className="form-field__error" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className={`cart-button admin-panel__submit${isCancel ? ' admin-panel__submit--danger' : ''}`}
        disabled={isSaving}
      >
        {isSaving ? 'Зберігаємо…' : isCancel ? 'Скасувати замовлення' : 'Змінити статус'}
      </button>
    </form>
  );
}

interface PaymentPanelProps {
  order: AdminOrder;
  onChanged: (order: AdminOrder) => void;
}

/** Статус оплати (бачить Клієнт) і службова примітка (лише Адміністратор) — UC-ADM-ORD-03 */
function PaymentPanel({ order, onChanged }: PaymentPanelProps) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order.paymentStatus);
  const [internalNote, setInternalNote] = useState(order.internalNote ?? '');
  const [error, setError] = useState('');
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const noteError = validateInternalNote(internalNote);
    if (noteError) {
      setError(noteError);
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      const saved = await adminOrderService.updatePayment(order.number, {
        paymentStatus,
        internalNote: internalNote.trim(),
      });
      onChanged(saved);
      setMessage({ kind: 'success', text: 'Збережено.' });
    } catch (failure) {
      setMessage({ kind: 'error', text: getErrorMessage(failure) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="admin-panel" onSubmit={handleSubmit} noValidate>
      <h3 className="admin-panel__title">Оплата й примітка</h3>
      {message && <Notice kind={message.kind}>{message.text}</Notice>}

      <fieldset className="admin-panel__fieldset">
        <legend className="admin-panel__label">Статус оплати (бачить клієнт)</legend>
        <div className="choice-group">
          {(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map((status) => (
            <label key={status} className="choice-group__option">
              <input
                type="radio"
                name="payment-status"
                value={status}
                checked={paymentStatus === status}
                onChange={() => {
                  setPaymentStatus(status);
                  setMessage(null);
                }}
              />
              {PAYMENT_STATUS_LABELS[status]}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="form-field__label" htmlFor="internal-note">
        Службова примітка (бачить лише адміністратор)
      </label>
      <textarea
        id="internal-note"
        className={`form-field__input${error ? ' form-field__input--invalid' : ''}`}
        rows={3}
        value={internalNote}
        aria-describedby="internal-note-counter"
        onChange={(event) => {
          setInternalNote(event.target.value);
          setError('');
          setMessage(null);
        }}
      />
      <p
        id="internal-note-counter"
        className={`form-field__hint${internalNote.length > INTERNAL_NOTE_MAX ? ' form-field__hint--over' : ''}`}
      >
        {internalNote.length} / {INTERNAL_NOTE_MAX}
      </p>
      {error && (
        <p className="form-field__error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="cart-button admin-panel__submit" disabled={isSaving}>
        {isSaving ? 'Зберігаємо…' : 'Зберегти'}
      </button>
    </form>
  );
}
