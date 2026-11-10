import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { orderService } from '../api';
import { ApiError } from '../api/ApiError';
import type { FieldErrors } from '../api/ApiError';
import Breadcrumbs from '../components/Breadcrumbs';
import FormField from '../components/FormField';
import ListState from '../components/ListState';
import Notice from '../components/Notice';
import OrderSummary from '../components/OrderSummary';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCartCheck } from '../hooks/useCartCheck';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import type { DeliveryInfo, DeliveryInterval, DeliveryMethod, PaymentMethod, User } from '../types';
import { kyivToday } from '../utils/dates';
import { formatPrice } from '../utils/format';
import {
  DELIVERY_LABELS,
  INTERVAL_LABELS,
  PAYMENT_LABELS,
  PAYMENTS_BY_DELIVERY,
} from '../utils/labels';
import {
  addDays,
  COMMENT_MAX,
  HINTS,
  normalizePhone,
  validateAddress,
  validateComment,
  validateDeliveryDate,
  validateFullName,
  validatePhone,
  validatePlace,
} from '../validation/rules';

const CHECKOUT_PATH = '/checkout';

/** Оформлення замовлення (UC-ORD-01). Спершу — умови, за яких форму не показуємо */
export default function CheckoutPage() {
  useDocumentTitle('Оформлення замовлення');
  const { user, status } = useAuth();
  const { items } = useCart();

  if (status === 'loading') return <ListState kind="loading" />;

  let content: ReactNode;
  if (!user) {
    // А1: пропонуємо увійти або зареєструватися й повертаємо сюди з тим самим кошиком
    content = (
      <Notice kind="info" title="Увійдіть, щоб оформити замовлення">
        <p>Кошик збережено — після входу ви повернетеся до оформлення.</p>
        <div className="notice__actions">
          <Link className="cart-button" to="/login" state={{ from: CHECKOUT_PATH }}>
            Увійти
          </Link>
          <Link className="notice__link" to="/register" state={{ from: CHECKOUT_PATH }}>
            Зареєструватися
          </Link>
        </div>
      </Notice>
    );
  } else if (user.role === 'admin') {
    // А2
    content = (
      <Notice kind="warning" title="Замовлення оформлює Клієнт">
        Ви увійшли як адміністратор. Щоб оформити замовлення, увійдіть з обліковим записом клієнта.
      </Notice>
    );
  } else if (items.length === 0) {
    // А3
    content = (
      <ListState kind="empty" text="Кошик порожній. Додайте товари, щоб оформити замовлення.">
        <Link className="cart-button list-state__retry" to="/#catalog">
          До каталогу
        </Link>
      </ListState>
    );
  } else {
    content = <CheckoutForm user={user} />;
  }

  return (
    <main className="checkout-page">
      <Breadcrumbs
        items={[{ label: 'Головна', to: '/' }, { label: 'Кошик', to: '/cart' }, { label: 'Оформлення' }]}
      />
      <h2 className="checkout-page__title">Оформлення замовлення</h2>
      {content}
    </main>
  );
}

interface FormState {
  fullName: string;
  phone: string;
  delivery: DeliveryMethod;
  address: string;
  date: string;
  interval: DeliveryInterval | '';
  city: string;
  branch: string;
  payment: PaymentMethod;
  comment: string;
}

/** Перевірка форми за таблицею 3.5 і FUN-06 — ті самі правила перевіряє бекенд */
function validateForm(form: FormState): FieldErrors {
  const checks: Record<string, string | null> = {
    fullName: validateFullName(form.fullName),
    phone: validatePhone(form.phone),
    comment: validateComment(form.comment),
  };
  if (form.delivery === 'courier') {
    checks.address = validateAddress(form.address);
    checks.date = validateDeliveryDate(form.date, kyivToday());
    checks.interval = form.interval ? null : 'Оберіть інтервал доставки.';
  }
  if (form.delivery === 'nova_poshta') {
    checks.city = validatePlace(form.city, 'місто');
    checks.branch = validatePlace(form.branch, 'відділення');
  }
  if (!PAYMENTS_BY_DELIVERY[form.delivery].includes(form.payment)) {
    checks.payment = 'Оберіть спосіб оплати.';
  }
  return Object.fromEntries(Object.entries(checks).filter(([, message]) => message)) as FieldErrors;
}

function toDelivery(form: FormState): DeliveryInfo {
  if (form.delivery === 'courier') {
    return {
      method: 'courier',
      address: form.address.trim(),
      date: form.date,
      interval: form.interval as DeliveryInterval,
    };
  }
  if (form.delivery === 'nova_poshta') {
    return { method: 'nova_poshta', city: form.city.trim(), branch: form.branch.trim() };
  }
  return { method: 'pickup' };
}

/** Порядок полів — щоб після невдалої перевірки поставити фокус на перше некоректне */
const FIELD_ORDER = ['fullName', 'phone', 'address', 'date', 'interval', 'city', 'branch', 'payment', 'comment'];
const FIELD_IDS: Record<string, string> = {
  fullName: 'checkout-name',
  phone: 'checkout-phone',
  address: 'checkout-address',
  date: 'checkout-date',
  interval: 'checkout-interval',
  city: 'checkout-city',
  branch: 'checkout-branch',
  payment: 'payment-cash_on_receipt',
  comment: 'checkout-comment',
};

function newIdempotencyKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function CheckoutForm({ user }: { user: User }) {
  const navigate = useNavigate();
  const { forgetUser } = useAuth();
  const { clearCart } = useCart();
  const { lines, total, priceChanges, hasBlocking, error: checkError, recheck, acceptPrices } =
    useCartCheck();

  // крок 4: ПІБ, телефон і адреса — з профілю
  const [form, setForm] = useState<FormState>({
    fullName: user.fullName,
    phone: user.phone,
    delivery: 'pickup',
    address: user.deliveryAddress ?? '',
    date: '',
    interval: '',
    city: '',
    branch: '',
    payment: 'cash_on_receipt',
    comment: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<{ text: string; relogin?: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // один ключ на це оформлення: повторне натискання поверне те саме замовлення (А7, REL-02)
  const [idempotencyKey] = useState(newIdempotencyKey);
  const formRef = useRef<HTMLFormElement>(null);

  const today = kyivToday();
  const allowedPayments = PAYMENTS_BY_DELIVERY[form.delivery];

  // якщо для нової доставки обрана оплата недопустима — беремо першу допустиму (таблиця 3.4)
  useEffect(() => {
    if (!allowedPayments.includes(form.payment)) {
      setForm((current) => ({ ...current, payment: allowedPayments[0] }));
    }
  }, [allowedPayments, form.payment]);

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  // А4: товар зник або закінчився — повертаємо до кошика
  if (hasBlocking) return <Navigate to="/cart" replace state={{ blocked: true }} />;
  if (!lines) {
    return checkError ? (
      <ListState kind="error" error={checkError} onRetry={recheck} />
    ) : (
      <ListState kind="loading" text="Перевіряємо кошик…" />
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return; // друге натискання, поки триває перше
    setFormError(null);

    const found = validateForm(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = FIELD_ORDER.find((field) => found[field]);
      if (first) document.getElementById(FIELD_IDS[first])?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await orderService.createOrder({
        items: lines.map((line) => ({
          productId: line.item.product.id,
          quantity: line.item.quantity,
          price: line.current!.price,
        })),
        recipient: { fullName: form.fullName.trim(), phone: normalizePhone(form.phone) },
        delivery: toDelivery(form),
        payment: form.payment,
        comment: form.comment.trim(),
        idempotencyKey,
      });
      // крок 14: показуємо номер замовлення й очищуємо кошик
      navigate('/order/success', { replace: true, state: { order } });
      clearCart();
    } catch (error) {
      setIsSubmitting(false);
      if (!(error instanceof ApiError)) {
        setFormError({ text: 'Щось пішло не так. Спробуйте ще раз — кошик і дані збережено.' });
        return;
      }
      switch (error.code) {
        case 'VALIDATION_ERROR': // А6
          setErrors(error.fields);
          setFormError({ text: error.message });
          break;
        case 'CART_CHANGED': // А4, А5: звіряємо кошик ще раз і показуємо зміни
          recheck();
          setFormError({ text: error.message });
          break;
        case 'UNAUTHORIZED': // А9: сесії немає — сторінка покаже «Увійдіть», кошик лишається
          forgetUser();
          return;
        case 'ACCOUNT_DISABLED':
          setFormError({ text: error.message, relogin: true });
          break;
        default: // А8: збій збереження — кошик і введені дані лишаються
          setFormError({
            text: `${error.message} Кошик і введені дані збережено — спробуйте ще раз.`,
          });
      }
      formRef.current?.scrollIntoView({ block: 'start' });
    }
  };

  const summaryLines = lines.map((line) => ({
    key: line.item.product.id,
    name: line.item.product.name,
    price: line.current!.price,
    quantity: line.item.quantity,
  }));

  return (
    <form ref={formRef} className="checkout" onSubmit={handleSubmit} noValidate>
      <div className="checkout__main">
        {formError && (
          <Notice kind="error">
            {formError.text}{' '}
            {formError.relogin && (
              <Link to="/login" state={{ from: CHECKOUT_PATH }}>
                Увійти знову
              </Link>
            )}
          </Notice>
        )}

        {/* А5: ціна змінилась — показуємо стару й нову, Клієнт погоджується або змінює кошик */}
        {priceChanges.length > 0 && (
          <Notice kind="warning" title="Ціни змінилися">
            <ul className="notice__list">
              {priceChanges.map((line) => (
                <li key={line.item.product.id}>
                  {line.item.product.name}: <s>{formatPrice(line.seenPrice)}</s> →{' '}
                  <strong>{formatPrice(line.current!.price)}</strong>
                </li>
              ))}
            </ul>
            <p>Нова сума замовлення: {formatPrice(total)}.</p>
            <div className="notice__actions">
              <button type="button" className="cart-button" onClick={acceptPrices}>
                Погоджуюсь з новими цінами
              </button>
              <Link className="notice__link" to="/cart">
                Змінити кошик
              </Link>
            </div>
          </Notice>
        )}

        <fieldset className="checkout__section">
          <legend className="checkout__legend">Отримувач</legend>
          <FormField
            id="checkout-name"
            label="ПІБ"
            autoComplete="name"
            value={form.fullName}
            hint={HINTS.fullName}
            error={errors.fullName}
            onChange={(event) => update('fullName', event.target.value)}
          />
          <FormField
            id="checkout-phone"
            label="Телефон"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            hint={HINTS.phone}
            error={errors.phone}
            onChange={(event) => update('phone', event.target.value)}
          />
        </fieldset>

        <fieldset className="checkout__section">
          <legend className="checkout__legend">Доставка</legend>
          <div className="choice-group">
            {(Object.keys(DELIVERY_LABELS) as DeliveryMethod[]).map((method) => (
              <label key={method} className="choice-group__option">
                <input
                  type="radio"
                  name="delivery"
                  value={method}
                  checked={form.delivery === method}
                  onChange={() => update('delivery', method)}
                />
                {DELIVERY_LABELS[method]}
              </label>
            ))}
          </div>

          {form.delivery === 'pickup' && (
            <p className="checkout__hint">Заберіть замовлення в магазині після дзвінка менеджера.</p>
          )}

          {form.delivery === 'courier' && (
            <>
              <FormField
                id="checkout-address"
                label="Адреса"
                autoComplete="street-address"
                value={form.address}
                hint="Місто, вулиця, будинок, квартира — від 5 до 200 символів"
                error={errors.address}
                onChange={(event) => update('address', event.target.value)}
              />
              <div className="checkout__row">
                <FormField
                  id="checkout-date"
                  label="Дата"
                  type="date"
                  min={addDays(today, 1)}
                  max={addDays(today, 14)}
                  value={form.date}
                  hint="Від завтра до 14 днів"
                  error={errors.date}
                  onChange={(event) => update('date', event.target.value)}
                />
                <div className="form-field">
                  <label className="form-field__label" htmlFor="checkout-interval">
                    Інтервал
                  </label>
                  <select
                    id="checkout-interval"
                    className={`form-field__input${errors.interval ? ' form-field__input--invalid' : ''}`}
                    value={form.interval}
                    aria-invalid={errors.interval ? true : undefined}
                    aria-describedby={errors.interval ? 'checkout-interval-error' : undefined}
                    onChange={(event) => update('interval', event.target.value as DeliveryInterval | '')}
                  >
                    <option value="">Оберіть інтервал</option>
                    {(Object.keys(INTERVAL_LABELS) as DeliveryInterval[]).map((interval) => (
                      <option key={interval} value={interval}>
                        {INTERVAL_LABELS[interval]}
                      </option>
                    ))}
                  </select>
                  {errors.interval && (
                    <p id="checkout-interval-error" className="form-field__error">
                      {errors.interval}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {form.delivery === 'nova_poshta' && (
            <div className="checkout__row">
              <FormField
                id="checkout-city"
                label="Місто"
                autoComplete="address-level2"
                value={form.city}
                error={errors.city}
                onChange={(event) => update('city', event.target.value)}
              />
              <FormField
                id="checkout-branch"
                label="Відділення"
                value={form.branch}
                hint="Наприклад: Відділення № 5"
                error={errors.branch}
                onChange={(event) => update('branch', event.target.value)}
              />
            </div>
          )}
        </fieldset>

        <fieldset className="checkout__section">
          <legend className="checkout__legend">Оплата</legend>
          <div className="choice-group" aria-describedby={errors.payment ? 'payment-error' : undefined}>
            {allowedPayments.map((payment) => (
              <label key={payment} className="choice-group__option">
                <input
                  id={`payment-${payment}`}
                  type="radio"
                  name="payment"
                  value={payment}
                  checked={form.payment === payment}
                  onChange={() => update('payment', payment)}
                />
                {PAYMENT_LABELS[payment]}
              </label>
            ))}
          </div>
          {errors.payment && (
            <p id="payment-error" className="form-field__error">
              {errors.payment}
            </p>
          )}
        </fieldset>

        <fieldset className="checkout__section">
          <legend className="checkout__legend">Коментар для менеджера</legend>
          <div className="form-field">
            <label className="form-field__label visually-hidden" htmlFor="checkout-comment">
              Коментар для менеджера
            </label>
            <textarea
              id="checkout-comment"
              className={`form-field__input checkout__comment${errors.comment ? ' form-field__input--invalid' : ''}`}
              rows={4}
              value={form.comment}
              placeholder="Необов’язково: зручний час для дзвінка, під’їзд, поверх…"
              aria-invalid={errors.comment ? true : undefined}
              aria-describedby="checkout-comment-counter"
              onChange={(event) => update('comment', event.target.value)}
            />
            <p
              id="checkout-comment-counter"
              className={`form-field__hint${form.comment.length > COMMENT_MAX ? ' form-field__hint--over' : ''}`}
            >
              {form.comment.length} / {COMMENT_MAX}
            </p>
            {errors.comment && <p className="form-field__error">{errors.comment}</p>}
          </div>
        </fieldset>
      </div>

      <aside className="checkout__aside">
        <OrderSummary
          lines={summaryLines}
          total={total}
          delivery={toDelivery(form)}
          payment={form.payment}
        />

        {/* FUN-11: повідомлення про обробку персональних даних */}
        <p className="checkout__notice">
          Підтверджуючи замовлення, ви погоджуєтеся на обробку персональних даних (ПІБ, телефон,
          адреса доставки) магазином «ДомТех» для виконання замовлення відповідно до Закону України
          «Про захист персональних даних».
        </p>

        <button
          className="cart-button checkout__submit"
          type="submit"
          disabled={isSubmitting || priceChanges.length > 0}
        >
          {isSubmitting ? 'Оформлюємо…' : 'Підтвердити замовлення'}
        </button>
        {priceChanges.length > 0 && (
          <p className="checkout__hint">Спершу погодьтеся з новими цінами або змініть кошик.</p>
        )}
      </aside>
    </form>
  );
}
