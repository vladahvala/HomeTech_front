import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getProductById } from '../data/products';
import type { CartItem, Product } from '../types';

const STORAGE_KEY = 'hometech-cart';
export const MAX_QUANTITY = 99;

/** У localStorage зберігаємо лише id і кількість, а дані товару беремо з каталогу */
interface StoredLine {
  id: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  totalCount: number;
  totalPrice: number;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): StoredLine[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line): line is StoredLine =>
        typeof line?.id === 'number' && typeof line?.quantity === 'number' && line.quantity > 0,
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<StoredLine[]>(loadCart);

  // кошик зберігається між перезавантаженнями сторінки
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // localStorage може бути недоступний (приватний режим) — тоді просто не зберігаємо
    }
  }, [lines]);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    setLines((current) => {
      const existing = current.find((line) => line.id === product.id);
      if (!existing) {
        return [...current, { id: product.id, quantity: Math.min(quantity, MAX_QUANTITY) }];
      }
      return current.map((line) =>
        line.id === product.id
          ? { ...line, quantity: Math.min(line.quantity + quantity, MAX_QUANTITY) }
          : line,
      );
    });
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setLines((current) => current.filter((line) => line.id !== productId));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const items = lines.flatMap((line) => {
      const product = getProductById(line.id);
      return product ? [{ product, quantity: line.quantity }] : [];
    });

    return {
      items,
      totalCount: items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: items.reduce((sum, item) => sum + item.quantity * item.product.price, 0),
      addToCart,
      removeFromCart,
      clearCart,
    };
  }, [lines, addToCart, removeFromCart, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart потрібно викликати всередині <CartProvider>');
  }
  return context;
}