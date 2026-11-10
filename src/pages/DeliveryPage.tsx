import { Link } from 'react-router';
import Breadcrumbs from '../components/Breadcrumbs';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import type { DeliveryInterval, DeliveryMethod, PaymentMethod } from '../types';
import {
  DELIVERY_LABELS,
  INTERVAL_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENTS_BY_DELIVERY,
} from '../utils/labels';

const METHODS = Object.keys(DELIVERY_LABELS) as DeliveryMethod[];
const PAYMENTS = Object.keys(PAYMENT_LABELS) as PaymentMethod[];
const INTERVALS = Object.keys(INTERVAL_LABELS) as DeliveryInterval[];

/**
 * Доставка й оплата. Усе береться з тих самих правил, що й оформлення
 * замовлення (FUN-06, таблиця 3.4), тож сторінка не розійдеться з формою.
 */
export default function DeliveryPage() {
  useDocumentTitle('Доставка та оплата');

  return (
    <main className="info-page">
      <Breadcrumbs items={[{ label: 'Головна', to: '/' }, { label: 'Доставка та оплата' }]} />
      <h2 className="info-page__title">Доставка та оплата</h2>

      <section className="info-page__section" aria-labelledby="delivery-methods">
        <h3 id="delivery-methods" className="info-page__subtitle">
          Способи доставки
        </h3>
        <div className="info-cards">
          <article className="info-cards__item">
            <i className="info-cards__icon ri-store-2-line" aria-hidden="true" />
            <h4 className="info-cards__title">{DELIVERY_LABELS.pickup}</h4>
            <p className="info-cards__text">
              Заберіть замовлення в магазині, коли воно матиме статус «{ORDER_STATUS_LABELS.assembled}». Достатньо
              назвати номер замовлення.
            </p>
          </article>
          <article className="info-cards__item">
            <i className="info-cards__icon ri-truck-line" aria-hidden="true" />
            <h4 className="info-cards__title">{DELIVERY_LABELS.courier}</h4>
            <p className="info-cards__text">
              Вкажіть адресу, дату й зручний інтервал. Дата — від завтра до 14 днів від дня оформлення.
            </p>
            <ul className="info-cards__list">
              {INTERVALS.map((interval) => (
                <li key={interval}>{INTERVAL_LABELS[interval]}</li>
              ))}
            </ul>
          </article>
          <article className="info-cards__item">
            <i className="info-cards__icon ri-mail-send-line" aria-hidden="true" />
            <h4 className="info-cards__title">{DELIVERY_LABELS.nova_poshta}</h4>
            <p className="info-cards__text">
              Вкажіть місто й відділення. Після відправлення номер накладної з’явиться в примітці до замовлення в
              особистому кабінеті.
            </p>
          </article>
        </div>
      </section>

      <section className="info-page__section" aria-labelledby="delivery-payments">
        <h3 id="delivery-payments" className="info-page__subtitle">
          Способи оплати
        </h3>
        <p className="info-page__text">Спосіб оплати залежить від доставки:</p>
        <div className="info-page__table-wrap">
          <table className="orders-table info-page__table">
            <thead>
              <tr>
                <th scope="col">Оплата</th>
                {METHODS.map((method) => (
                  <th key={method} scope="col">
                    {DELIVERY_LABELS[method]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PAYMENTS.map((payment) => (
                <tr key={payment}>
                  <th scope="row">{PAYMENT_LABELS[payment]}</th>
                  {METHODS.map((method) => {
                    const allowed = PAYMENTS_BY_DELIVERY[method].includes(payment);
                    return (
                      <td key={method} data-label={DELIVERY_LABELS[method]}>
                        <span className={`info-page__mark info-page__mark--${allowed ? 'yes' : 'no'}`}>
                          {allowed ? 'Так' : 'Ні'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="info-page__text">
          Замовлення створюється зі статусом оплати «{PAYMENT_STATUS_LABELS.unpaid}». Коли магазин отримає оплату,
          статус зміниться на «{PAYMENT_STATUS_LABELS.paid}» — його видно в особистому кабінеті.
        </p>
      </section>

      <section className="info-page__section" aria-labelledby="delivery-order">
        <h3 id="delivery-order" className="info-page__subtitle">
          Як проходить замовлення
        </h3>
        <ol className="info-steps">
          <li>
            <strong>{ORDER_STATUS_LABELS.new}</strong> — ви оформили замовлення й отримали його номер.
          </li>
          <li>
            <strong>{ORDER_STATUS_LABELS.processing}</strong> — магазин перевіряє наявність і готує замовлення.
          </li>
          <li>
            <strong>{ORDER_STATUS_LABELS.assembled}</strong> — товари зібрано; для самовивозу замовлення можна
            забирати.
          </li>
          <li>
            <strong>{ORDER_STATUS_LABELS.shipped}</strong> — замовлення передано кур’єру чи Новій пошті.
          </li>
          <li>
            <strong>{ORDER_STATUS_LABELS.delivered}</strong> — ви отримали замовлення.
          </li>
        </ol>
        <p className="info-page__text">
          Поки замовлення має статус «{ORDER_STATUS_LABELS.new}» або «{ORDER_STATUS_LABELS.processing}», його можна
          скасувати в <Link to="/account/orders">особистому кабінеті</Link>. Усі зміни статусу з датами й примітками
          видно там само.
        </p>
      </section>

      <p className="info-page__cta">
        <Link className="cart-button info-page__button" to="/catalog">
          Перейти до каталогу
        </Link>
      </p>
    </main>
  );
}
