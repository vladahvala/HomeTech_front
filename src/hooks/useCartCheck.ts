import { useCallback, useMemo } from 'react';
import { orderService } from '../api';
import { useCart } from '../context/CartContext';
import type { CartItem, ProductSummary } from '../types';
import { useAsync } from './useAsync';

/**
 * Стан позиції після звірки з сервером (UC-CRT-03):
 * ok — без змін; price_changed — нова ціна; out_of_stock — статус «Немає»;
 * unavailable — товар видалено або приховано.
 */
export type LineState = 'ok' | 'price_changed' | 'out_of_stock' | 'unavailable';

export interface CheckedLine {
  item: CartItem;
  /** Поточні дані з сервера; null — товар недоступний */
  current: ProductSummary | null;
  state: LineState;
  /** Ціна, яку Клієнт бачив раніше (знімок у кошику) */
  seenPrice: number;
}

/** Позиції, через які оформити замовлення не можна, поки їх не видалять */
export const isBlocking = (line: CheckedLine) =>
  line.state === 'out_of_stock' || line.state === 'unavailable';

/**
 * Звіряє кошик з актуальними цінами, наявністю й видимістю товарів
 * під час кожного перегляду й зміни кошика (UC-CRT-03, крок 3 UC-ORD-01).
 */
export function useCartCheck() {
  const { items, refreshProducts } = useCart();
  const key = items.map((item) => `${item.product.id}:${item.quantity}`).join(',');

  const check = useAsync(
    () => orderService.checkCart(items.map((item) => item.product.id)),
    [key],
  );

  const lines = useMemo<CheckedLine[] | null>(() => {
    if (!check.data) return null;
    const result: CheckedLine[] = [];
    for (const item of items) {
      const line = check.data.find((entry) => entry.productId === item.product.id);
      // позиція щойно додана й ще не звірена — чекаємо наступної відповіді
      if (!line) return null;
      const current = line.product;
      let state: LineState = 'ok';
      if (!current) state = 'unavailable';
      else if (current.availability === 'out_of_stock') state = 'out_of_stock';
      else if (current.price !== item.product.price) state = 'price_changed';
      result.push({ item, current, state, seenPrice: item.product.price });
    }
    return result;
  }, [check.data, items]);

  const orderable = lines?.filter((line) => !isBlocking(line)) ?? [];
  const total = orderable.reduce((sum, line) => sum + line.current!.price * line.item.quantity, 0);
  const priceChanges = lines?.filter((line) => line.state === 'price_changed') ?? [];
  const hasBlocking = lines?.some(isBlocking) ?? false;

  /** Клієнт побачив нові ціни — запам'ятовуємо їх як «бачені» */
  const acceptPrices = useCallback(() => {
    refreshProducts(
      (lines ?? []).flatMap((line) => (line.current ? [line.current] : [])),
    );
  }, [lines, refreshProducts]);

  return {
    lines,
    total,
    priceChanges,
    hasBlocking,
    isChecking: check.isLoading,
    error: check.error,
    recheck: check.reload,
    acceptPrices,
  };
}
