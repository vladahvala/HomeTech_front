import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { CartItem, ProductSummary } from '../types';
import { canOrder } from '../utils/labels';

const STORAGE_KEY = 'hometech-cart';
/** Від 1 до 99 одиниць на позицію (FUN-07) */
export const MAX_QUANTITY = 99;
/** До 50 різних товарів у кошику (таблиця 3.5) */
export const MAX_LINES = 50;

export type AddToCartResult = 'added' | 'cart_full' | 'unavailable';

interface CartContextValue {
  items: CartItem[];
  totalCount: number;
  totalPrice: number;
  /** Додає товар або збільшує кількість наявної позиції */
  addToCart: (product: ProductSummary, quantity?: number) => AddToCartResult;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function isCartItem(value: unknown): value is CartItem {
  const item = value as CartItem | null;
  return (
    typeof item?.quantity === 'number' &&
    item.quantity > 0 &&
    typeof item.product?.id === 'number' &&
    typeof item.product.name === 'string' &&
    typeof item.product.price === 'number'
  );
}

/** Кошик зберігається на пристрої й не залежить від входу/виходу (UC-CRT-01) */
function loadCart(): CartItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    // записи старого формату (лише id і кількість) просто відкидаємо
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // localStorage недоступний (приватний режим) — просто не зберігаємо
    }
  }, [items]);

  const addToCart = useCallback(
    (product: ProductSummary, quantity = 1): AddToCartResult => {
      if (!canOrder(product.availability)) return 'unavailable';

      const exists = items.some((item) => item.product.id === product.id);
      if (!exists && items.length >= MAX_LINES) return 'cart_full';

      setItems((current) => {
        if (!current.some((item) => item.product.id === product.id)) {
          return [...current, { product, quantity: Math.min(quantity, MAX_QUANTITY) }];
        }
        return current.map((item) =>
          item.product.id === product.id
            ? { product, quantity: Math.min(item.quantity + quantity, MAX_QUANTITY) }
            : item,
        );
      });
      return 'added';
    },
    [items],
  );

  const removeFromCart = useCallback((productId: number) => {
    setItems((current) => current.filter((item) => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalCount: items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: items.reduce((sum, item) => sum + item.quantity * item.product.price, 0),
      addToCart,
      removeFromCart,
      clearCart,
    }),
    [items, addToCart, removeFromCart, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart потрібно викликати всередині <CartProvider>');
  }
  return context;
}

/** Текст для кнопки після спроби додати товар */
export const ADD_RESULT_LABELS: Record<AddToCartResult, string> = {
  added: 'Додано в кошик',
  cart_full: `У кошику вже ${MAX_LINES} товарів`,
  unavailable: 'Немає в наявності',
};
