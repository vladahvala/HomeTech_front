import type { Availability, CharacteristicType, SortOrder } from '../types';

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
