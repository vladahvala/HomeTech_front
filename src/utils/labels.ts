import type {
  Availability,
  CharacteristicType,
  DeliveryInterval,
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductSource,
  SortOrder,
} from '../types';

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  in_stock: 'В наявності',
  expected: 'Очікується',
  out_of_stock: 'Немає',
};

/** Товар можна покласти в кошик і замовити (FUN-07) */
export function canOrder(availability: Availability): boolean {
  return availability === 'in_stock' || availability === 'expected';
}

export const SORT_LABELS: Record<SortOrder, string> = {
  default: 'За замовчуванням',
  price_asc: 'Від дешевших',
  price_desc: 'Від дорожчих',
  newest: 'Новіші першими',
};

const numberFormatter = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 });

/** Значення фільтра для показу: '1.7' → «1,7 л», 'true' → «Так» */
export function formatCharacteristicValue(
  value: string,
  type: CharacteristicType,
  unit: string | null,
): string {
  if (type === 'boolean') return value === 'true' ? 'Так' : 'Ні';
  if (type === 'number') {
    const number = Number(value);
    const text = Number.isFinite(number) ? numberFormatter.format(number) : value;
    return unit ? `${text} ${unit}` : text;
  }
  return unit ? `${value} ${unit}` : value;
}

/** «12 місяців», «1 рік» — гарантія для картки товару */
export function formatWarranty(months: number): string {
  if (months === 0) return 'Без гарантії';
  if (months % 12 === 0) {
    const years = months / 12;
    return `${years} ${pluralize(years, ['рік', 'роки', 'років'])}`;
  }
  return `${months} ${pluralize(months, ['місяць', 'місяці', 'місяців'])}`;
}

/** Українські форми слова: 1 товар, 2 товари, 5 товарів */
export function pluralize(count: number, [one, few, many]: [string, string, string]): string {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}

// ===== Доставка, оплата, статуси замовлення =====

export const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  pickup: 'Самовивіз з магазину',
  courier: 'Кур’єр по місту',
  nova_poshta: 'Нова пошта',
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash_on_receipt: 'Готівкою при отриманні',
  card_on_receipt: 'Карткою при отриманні',
  cash_on_delivery: 'Накладений платіж',
  invoice: 'Безготівковий розрахунок за рахунком',
};

/** Допустимі способи оплати для кожної доставки — таблиця 3.4 */
export const PAYMENTS_BY_DELIVERY: Record<DeliveryMethod, PaymentMethod[]> = {
  pickup: ['cash_on_receipt', 'card_on_receipt', 'invoice'],
  courier: ['cash_on_receipt', 'card_on_receipt', 'invoice'],
  nova_poshta: ['cash_on_delivery', 'invoice'],
};

export const INTERVAL_LABELS: Record<DeliveryInterval, string> = {
  '09-12': '09:00–12:00',
  '12-15': '12:00–15:00',
  '15-18': '15:00–18:00',
  '18-21': '18:00–21:00',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Нове',
  processing: 'В обробці',
  assembled: 'Зібране',
  shipped: 'Відправлене',
  delivered: 'Поставлене',
  cancelled: 'Скасоване',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'Не оплачено',
  paid: 'Оплачено',
};

/** Клієнт може скасувати лише «Нове» й «В обробці» (таблиця 3.3) */
export function canClientCancel(status: OrderStatus): boolean {
  return status === 'new' || status === 'processing';
}

// ===== Адмінка: каталог =====

export const SOURCE_LABELS: Record<ProductSource, string> = {
  katran: 'Прайс Katran',
  manual: 'Вручну',
};

export const CHARACTERISTIC_TYPE_LABELS: Record<CharacteristicType, string> = {
  number: 'Число',
  enum: 'Перелік',
  boolean: 'Так/ні',
  text: 'Текст',
};
