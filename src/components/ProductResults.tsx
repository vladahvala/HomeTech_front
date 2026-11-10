import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { AsyncState } from '../hooks/useAsync';
import type { Page, ProductSummary } from '../types';
import ListState from './ListState';
import ProductCard from './ProductCard';

interface ProductResultsProps {
  state: AsyncState<Page<ProductSummary>>;
  /** Текст, коли товарів немає */
  emptyText: string;
  /** Наприклад, кнопка «Скинути фільтри» під порожнім результатом */
  emptyAction?: ReactNode;
  /** Адреса першої сторінки — якщо відкрили номер сторінки, якої вже немає */
  firstPageHref: string;
}

/** Сітка товарів зі станами завантаження, помилки й порожнього результату (USB-04) */
export default function ProductResults({
  state,
  emptyText,
  emptyAction,
  firstPageHref,
}: ProductResultsProps) {
  const { data, error, isLoading, reload } = state;

  if (error) return <ListState kind="error" error={error} onRetry={reload} />;
  if (!data) return <ListState kind="loading" text="Завантажуємо товари…" />;
  if (data.items.length === 0 && !isLoading && data.total > 0) {
    return (
      <ListState kind="empty" text="На цій сторінці товарів немає.">
        <Link className="cart-button list-state__retry" to={firstPageHref}>
          До першої сторінки
        </Link>
      </ListState>
    );
  }
  if (data.items.length === 0 && !isLoading) {
    return (
      <ListState kind="empty" text={emptyText}>
        {emptyAction}
      </ListState>
    );
  }

  // під час нового запиту лишаємо попередній список, лише притлумлюємо його
  return (
    <div
      className={`catalog__products${isLoading ? ' catalog__products--loading' : ''}`}
      aria-busy={isLoading}
    >
      {data.items.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
