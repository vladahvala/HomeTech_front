import type { DeliveryInfo, PaymentMethod } from '../types';
import { formatDate } from '../utils/dates';
import { formatPrice } from '../utils/format';
import { DELIVERY_LABELS, INTERVAL_LABELS, PAYMENT_LABELS } from '../utils/labels';

export interface SummaryLine {
  key: number;
  name: string;
  price: number;
  quantity: number;
}

interface OrderSummaryProps {
  lines: SummaryLine[];
  total: number;
  delivery?: DeliveryInfo;
  payment?: PaymentMethod;
}

/**
 * Опис доставки одним рядком: «Кур’єр по місту: адреса, 13.11.2026, 12:00–15:00».
 * Поки форма заповнюється, порожні частини просто пропускаємо.
 */
export function describeDelivery(delivery: DeliveryInfo): string {
  let details: (string | undefined)[] = [];
  if (delivery.method === 'courier') {
    details = [
      delivery.address,
      delivery.date ? formatDate(delivery.date) : undefined,
      INTERVAL_LABELS[delivery.interval],
    ];
  } else if (delivery.method === 'nova_poshta') {
    details = [delivery.city, delivery.branch];
  }
  const filled = details.filter((part) => part && part.trim());
  const label = DELIVERY_LABELS[delivery.method];
  return filled.length ? `${label}: ${filled.join(', ')}` : label;
}

/** Підсумок: позиції з кількістю й сумами, загальна сума, доставка й оплата (крок 9 UC-ORD-01) */
export default function OrderSummary({ lines, total, delivery, payment }: OrderSummaryProps) {
  return (
    <section className="order-summary" aria-label="Підсумок замовлення">
      <h3 className="order-summary__title">Ваше замовлення</h3>

      <ul className="order-summary__list">
        {lines.map((line) => (
          <li key={line.key} className="order-summary__item">
            <span className="order-summary__name">
              {line.name} <span className="order-summary__quantity">× {line.quantity}</span>
            </span>
            <span className="order-summary__sum">{formatPrice(line.price * line.quantity)}</span>
          </li>
        ))}
      </ul>

      {delivery && (
        <p className="order-summary__row">
          <span>Доставка</span>
          <span>{describeDelivery(delivery)}</span>
        </p>
      )}
      {payment && (
        <p className="order-summary__row">
          <span>Оплата</span>
          <span>{PAYMENT_LABELS[payment]}</span>
        </p>
      )}

      <p className="order-summary__total">
        <span>Разом</span>
        <strong>{formatPrice(total)}</strong>
      </p>
    </section>
  );
}
